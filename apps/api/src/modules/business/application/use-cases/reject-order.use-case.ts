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
export class RejectOrderUseCase {
  constructor(
    @Inject('IBusinessOrderRepository')
    private readonly orderRepository: IBusinessOrderRepository,
    private readonly prisma: PrismaService,
    private readonly workflowService: OrderWorkflowService,
  ) {}

  async execute(businessId: string, orderId: string, reason: string) {
    const order = await this.orderRepository.findById(businessId, orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.status === OrderStatus.Cancelled ||
      order.status === OrderStatus.Completed
    ) {
      throw new BadRequestException(
        `Cannot reject order in status ${order.status}`,
      );
    }

    const updated = await this.workflowService.transition(
      order as any,
      OrderStatus.Cancelled,
      UserType.BusinessOwner,
      {
        notes: `Order rejected by business: ${reason}`,
        actorUserId: businessId,
      },
    );

    // TODO: Phase 9 notifies customer

    return updated;
  }
}
