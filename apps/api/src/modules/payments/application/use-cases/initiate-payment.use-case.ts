import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { GatewayFactory } from '../../infrastructure/gateways/gateway-factory';
import { PaymentMethod } from '@prisma/client';

export interface InitiatePaymentCommand {
  orderId: string;
  customerId: string;
  provider?: string;
}

@Injectable()
export class InitiatePaymentUseCase {
  // Configurable minimum percentage for partial payments
  private readonly PART_PAYMENT_PERCENTAGE = 0.5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: GatewayFactory,
  ) {}

  async execute(command: InitiatePaymentCommand) {
    const { orderId, customerId, provider = 'paystack' } = command;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: { user: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== customerId) {
      throw new BadRequestException('Order does not belong to this customer');
    }

    if (order.paymentStatus === 'Paid') {
      throw new BadRequestException('Order is already fully paid');
    }

    if (order.paymentMethod === PaymentMethod.PayOnDelivery) {
      return {
        message: 'Order is configured for PayOnDelivery. No online payment required.',
        method: PaymentMethod.PayOnDelivery,
      };
    }

    let amountToCharge = Number(order.total);

    if (order.paymentMethod === PaymentMethod.Part) {
      // Check if there are any existing successful or pending payments
      const existingPayments = await this.prisma.payment.findMany({
        where: { orderId },
      });

      const totalPaid = existingPayments
        .filter((p: any) => p.status === 'Paid')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      const remainingBalance = amountToCharge - totalPaid;

      if (remainingBalance <= 0) {
        throw new BadRequestException('Order is already fully paid');
      }

      // If no payments have been made yet, charge the part payment percentage
      if (existingPayments.length === 0) {
        amountToCharge = amountToCharge * this.PART_PAYMENT_PERCENTAGE;
      } else {
        // Charge the remaining balance
        amountToCharge = remainingBalance;
      }
    }

    const gateway = this.gatewayFactory.getPaymentGateway(provider);

    const initiationResult = await gateway.initiate(
      orderId,
      amountToCharge,
      order.currency,
      order.paymentMethod,
      order.customer.user.email || 'customer@example.com',
    );

    // Create a Pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        provider,
        providerReference: initiationResult.reference,
        amount: amountToCharge,
        currency: order.currency,
        method: order.paymentMethod,
        status: 'Pending',
      },
    });

    return {
      paymentId: payment.id,
      reference: initiationResult.reference,
      redirectUrl: initiationResult.redirectUrl,
      clientSecret: initiationResult.clientSecret,
    };
  }
}
