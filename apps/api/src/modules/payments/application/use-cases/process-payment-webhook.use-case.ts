import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { GatewayFactory } from '../../infrastructure/gateways/gateway-factory';
import { OrderWorkflowService } from '../../../orders/domain/services/order-workflow.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export interface ProcessPaymentWebhookCommand {
  provider: string;
  signature: string;
  payload: any;
}

@Injectable()
export class ProcessPaymentWebhookUseCase {
  private readonly logger = new Logger(ProcessPaymentWebhookUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: GatewayFactory,
    private readonly orderWorkflowService: OrderWorkflowService,
  ) {}

  async execute(command: ProcessPaymentWebhookCommand) {
    const { provider, signature, payload } = command;

    const gateway = this.gatewayFactory.getPaymentGateway(provider);

    // Verify signature
    const isValidSignature = gateway.verifyWebhookSignature(payload, signature);
    if (!isValidSignature) {
      this.logger.error(`Invalid webhook signature for provider: ${provider}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Extract reference and status from payload based on provider
    let reference: string;
    let isSuccess: boolean;
    let rawEventId: string;

    if (provider.toLowerCase() === 'paystack') {
      reference = payload.data.reference;
      isSuccess = payload.event === 'charge.success';
      rawEventId = String(payload.data.id || payload.event); // Using ID as event deduplication
    } else if (provider.toLowerCase() === 'flutterwave') {
      reference = payload.data.tx_ref;
      isSuccess = payload.event === 'charge.completed' && payload.data.status === 'successful';
      rawEventId = String(payload.data.id);
    } else if (provider.toLowerCase() === 'stripe') {
      // Stripe typically uses payment_intent.succeeded
      reference = payload.data.object.metadata?.orderId || payload.data.object.id; // Usually we'd map this properly
      isSuccess = payload.type === 'payment_intent.succeeded';
      rawEventId = payload.id;
    } else {
      throw new BadRequestException('Unsupported provider');
    }

    if (!reference) {
      throw new BadRequestException('No reference found in payload');
    }

    // Process idempotently
    return await this.prisma.$transaction(async (tx: any) => {
      // Lock payment record or find it
      const payment = await tx.payment.findUnique({
        where: { providerReference: reference },
        include: { order: true },
      });

      if (!payment) {
        this.logger.warn(`Payment with reference ${reference} not found`);
        return { message: 'Payment not found, ignored' };
      }

      if (payment.status === PaymentStatus.Paid || payment.status === PaymentStatus.Failed) {
        // Already processed
        return { message: 'Webhook already processed' };
      }

      const newStatus = isSuccess ? PaymentStatus.Paid : PaymentStatus.Failed;

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          rawPayload: payload,
          paidAt: isSuccess ? new Date() : null,
        },
      });

      // Update Order payment status if Full payment, or if all parts are paid
      if (isSuccess) {
        const existingPayments = await tx.payment.findMany({
          where: { orderId: payment.orderId, status: PaymentStatus.Paid },
        });
        
        const totalPaid = existingPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0) + (payment.status === 'Paid' ? 0 : Number(payment.amount));
        const orderTotal = Number(payment.order.total);

        let newOrderPaymentStatus: PaymentStatus = payment.order.paymentStatus;
        if (totalPaid >= orderTotal) {
          newOrderPaymentStatus = PaymentStatus.Paid;
        } else if (totalPaid > 0) {
          newOrderPaymentStatus = PaymentStatus.PartiallyPaid;
        }

        const updatedOrder = await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: newOrderPaymentStatus },
        });

        // Try to trigger transition to PaymentConfirmed if applicable
        if (newOrderPaymentStatus === PaymentStatus.Paid || payment.order.paymentMethod === 'Part') {
          // If we paid in part or full, and current status is AwaitingPayment, try transition
          if (updatedOrder.status === OrderStatus.AwaitingPayment) {
            try {
              // Passing updatedOrder which has the new paymentStatus
              await this.orderWorkflowService.transition(
                updatedOrder,
                OrderStatus.PaymentConfirmed,
                'System',
                { notes: `Payment ${payment.id} confirmed via webhook` },
                tx,
              );
            } catch (err) {
              this.logger.error(`Workflow transition failed for order ${payment.orderId}`, err);
              // Depending on requirements, we could swallow this or let the transaction fail.
              // We'll swallow it so the payment is recorded, and business can manually intervene if needed.
            }
          }
        }
      }

      return { message: 'Webhook processed successfully' };
    });
  }
}
