import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IBusinessOrderRepository } from '../../domain/repositories/business-order.repository.interface';
import { OrderStatus, UserType } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { OrderWorkflowService } from '../../../orders/domain/services/order-workflow.service';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject('IBusinessOrderRepository')
    private readonly orderRepository: IBusinessOrderRepository,
    private readonly prisma: PrismaService,
    private readonly workflowService: OrderWorkflowService,
  ) {}

  async execute(
    businessId: string,
    orderId: string,
    newStatus: OrderStatus,
    notes?: string,
  ) {
    const order = await this.orderRepository.findById(businessId, orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.status === OrderStatus.Cancelled ||
      order.status === OrderStatus.Completed
    ) {
      throw new BadRequestException(
        `Cannot change status of order in ${order.status}`,
      );
    }
    const updated = await this.workflowService.transition(
      order as any,
      newStatus,
      UserType.BusinessOwner,
      {
        notes: notes || `Order status updated to ${newStatus}`,
        actorUserId: businessId,
      },
    );

    return updated;
  }
}
