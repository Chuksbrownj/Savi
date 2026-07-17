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
import { OrderStatus } from '@prisma/client';

@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
  ) {}

  async execute(orderId: string, customerId: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    const cancelableStatuses: OrderStatus[] = [
      OrderStatus.Draft,
      OrderStatus.AwaitingPayment,
      OrderStatus.PaymentConfirmed,
      OrderStatus.AwaitingPickupAssignment,
    ];
    if (!cancelableStatuses.includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    const updatedOrder = await this.orderRepo.update(orderId, {
      status: OrderStatus.Cancelled,
    });

    await this.orderRepo.addTimelineEvent(
      orderId,
      OrderStatus.Cancelled,
      'Order cancelled by customer',
    );

    return updatedOrder;
  }
}
