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
import { OrderStatus, UserType } from '@prisma/client';
import { OrderWorkflowService } from '../../domain/services/order-workflow.service';

@Injectable()
export class ConfirmOrderReceiptUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    private readonly workflowService: OrderWorkflowService,
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

    const updatedOrder = await this.workflowService.transition(
      order as any,
      OrderStatus.Completed,
      UserType.Customer,
      { notes: 'Customer confirmed receipt', actorUserId: customerId },
    );

    return updatedOrder;
  }
}
