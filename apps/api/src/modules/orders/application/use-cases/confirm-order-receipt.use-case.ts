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
export class ConfirmOrderReceiptUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
  ) {}

  async execute(orderId: string, customerId: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.Delivered) {
      throw new BadRequestException(
        'Order must be delivered before confirming receipt',
      );
    }

    const updatedOrder = await this.orderRepo.update(orderId, {
      status: OrderStatus.Completed,
    });

    await this.orderRepo.addTimelineEvent(
      orderId,
      OrderStatus.Completed,
      'Customer confirmed receipt',
    );

    return updatedOrder;
  }
}
