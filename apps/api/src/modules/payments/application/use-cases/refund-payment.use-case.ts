import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { GatewayFactory } from '../../infrastructure/gateways/gateway-factory';
import { PaymentStatus } from '@prisma/client';

export interface RefundPaymentCommand {
  orderId: string;
  businessId: string;
  amount?: number; // if empty, full refund
  reason?: string;
  provider?: string;
}

@Injectable()
export class RefundPaymentUseCase {
  private readonly logger = new Logger(RefundPaymentUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: GatewayFactory,
  ) {}

  async execute(command: RefundPaymentCommand) {
    const { orderId, businessId, amount, reason, provider = 'paystack' } = command;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.businessId !== businessId) {
      throw new BadRequestException('Order does not belong to this business');
    }

    // Find the successful payment to refund
    const paidPayments = order.payments.filter((p: any) => p.status === PaymentStatus.Paid);
    if (paidPayments.length === 0) {
      throw new BadRequestException('No successful payments found to refund');
    }

    // Usually we would refund against specific payments. For simplicity, we refund against the first successful payment.
    const paymentToRefund = paidPayments[0];
    const refundAmount = amount || Number(paymentToRefund.amount);

    if (refundAmount > Number(paymentToRefund.amount)) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }

    const gateway = this.gatewayFactory.getPaymentGateway(paymentToRefund.provider);

    try {
      if (!paymentToRefund.providerReference) {
        throw new BadRequestException('Payment does not have a provider reference');
      }
      const refundResult = await gateway.refund(paymentToRefund.providerReference, refundAmount);

      // Create a refund record
      await this.prisma.$transaction(async (tx: any) => {
        await tx.refund.create({
          data: {
            paymentId: paymentToRefund.id,
            amount: refundAmount,
            reason: reason,
            status: 'Completed',
            providerReference: refundResult.reference,
          },
        });

        // If fully refunded, we update the payment status to Refunded
        if (refundAmount === Number(paymentToRefund.amount)) {
          await tx.payment.update({
            where: { id: paymentToRefund.id },
            data: { status: PaymentStatus.Refunded },
          });
        }
      });

      return {
        message: 'Refund successful',
        reference: refundResult.reference,
      };
    } catch (error) {
      this.logger.error(`Refund failed for payment ${paymentToRefund.id}`, error);
      
      // Optionally record a Failed refund attempt
      await this.prisma.refund.create({
        data: {
          paymentId: paymentToRefund.id,
          amount: refundAmount,
          reason: reason,
          status: 'Failed',
        },
      });

      throw new BadRequestException(`Refund failed: ${(error as Error).message}`);
    }
  }
}
