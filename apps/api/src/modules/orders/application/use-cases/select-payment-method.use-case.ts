import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  IOrderRepository,
} from '../../domain/repositories/order.repository.interface';
import {
  PAYMENT_INITIATION_SERVICE,
  IPaymentInitiationService,
} from '../../infrastructure/payments/payment-initiation.interface';
import { SelectPaymentMethodDto } from '../dtos/order.dto';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class SelectPaymentMethodUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    @Inject(PAYMENT_INITIATION_SERVICE)
    private readonly paymentService: IPaymentInitiationService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    orderId: string,
    customerId: string,
    dto: SelectPaymentMethodDto,
  ) {
    const order = await this.orderRepo.findById(orderId);
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.Draft) {
      throw new BadRequestException('Order is no longer in Draft status');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: order.businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (dto.method === PaymentMethod.Part) {
      const minPartial = 30; // 30% default
      if (
        !dto.partialPaymentPercent ||
        dto.partialPaymentPercent < minPartial
      ) {
        throw new BadRequestException(
          `Partial payment must be at least ${minPartial}%`,
        );
      }
    }

    const netAmount = order.total.toNumber() - order.discount.toNumber();
    let paymentAmount = netAmount;

    if (dto.method === PaymentMethod.Part && dto.partialPaymentPercent) {
      paymentAmount = (netAmount * dto.partialPaymentPercent) / 100;
    }

    // Move to AwaitingPayment
    const updatedOrder = await this.orderRepo.update(orderId, {
      status: OrderStatus.AwaitingPayment,
    });

    await this.orderRepo.addTimelineEvent(
      orderId,
      OrderStatus.AwaitingPayment,
      `Payment method selected: ${dto.method}`,
    );

    // If it's not PayOnDelivery, initiate payment intent
    let paymentIntent = null;
    if (dto.method !== PaymentMethod.PayOnDelivery) {
      paymentIntent = await this.paymentService.initiatePayment(
        orderId,
        paymentAmount,
        customerId,
      );
    }

    return {
      order: updatedOrder,
      paymentIntent,
    };
  }
}
