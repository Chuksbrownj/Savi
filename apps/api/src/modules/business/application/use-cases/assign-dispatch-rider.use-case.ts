import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IBusinessOrderRepository } from '../../domain/repositories/business-order.repository.interface';
import { IBusinessDispatchRepository } from '../../domain/repositories/business-dispatch.repository.interface';
import { DispatchTaskType, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AssignDispatchRiderUseCase {
  constructor(
    @Inject('IBusinessOrderRepository')
    private readonly orderRepository: IBusinessOrderRepository,
    @Inject('IBusinessDispatchRepository')
    private readonly dispatchRepository: IBusinessDispatchRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    businessId: string,
    orderId: string,
    riderId: string,
    type: DispatchTaskType,
  ) {
    const order = await this.orderRepository.findById(businessId, orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify rider belongs to business
    const rider = await this.prisma.dispatchRiderProfile.findFirst({
      where: { id: riderId, businessId, user: { isActive: true } },
    });

    if (!rider) {
      throw new BadRequestException('Invalid or inactive rider');
    }

    if (
      type === DispatchTaskType.Pickup &&
      order.status !== OrderStatus.AwaitingPickupAssignment
    ) {
      throw new BadRequestException(
        `Cannot assign pickup for order in status ${order.status}`,
      );
    }

    if (
      type === DispatchTaskType.Delivery &&
      order.status !== OrderStatus.ReadyForDelivery
    ) {
      throw new BadRequestException(
        `Cannot assign delivery for order in status ${order.status}`,
      );
    }

    // Ensure we don't already have an active task of this type for this order
    const existingTask = await this.prisma.dispatchTask.findFirst({
      where: {
        orderId,
        type,
        status: { notIn: ['Completed', 'Cancelled'] },
      },
    });

    if (existingTask) {
      throw new BadRequestException(`Order already has an active ${type} task`);
    }

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.dispatchTask.create({
        data: {
          orderId,
          businessId,
          riderId,
          type,
          status: 'Assigned',
          assignedAt: new Date(),
        },
      });

      // Update order status if needed
      // Note: we don't strictly change order status until rider accepts or picks it up,
      // but in some workflows "assigned" might be enough. We'll leave order status as is,
      // or we can transition it. Let's just create the task.

      return task;
    });
  }
}
