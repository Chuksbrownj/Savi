import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IBusinessOrderRepository } from '../../domain/repositories/business-order.repository.interface';
import { IBusinessDispatchRepository } from '../../domain/repositories/business-dispatch.repository.interface';
import { DispatchTaskType, OrderStatus, UserType } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { OrderWorkflowService } from '../../../orders/domain/services/order-workflow.service';

@Injectable()
export class AssignDispatchRiderUseCase {
  constructor(
    @Inject('IBusinessOrderRepository')
    private readonly orderRepository: IBusinessOrderRepository,
    @Inject('IBusinessDispatchRepository')
    private readonly dispatchRepository: IBusinessDispatchRepository,
    private readonly prisma: PrismaService,
    private readonly workflowService: OrderWorkflowService,
  ) {}

  async execute(
    businessId: string,
    orderId: string,
    riderId: string,
    type: DispatchTaskType,
    actorUserId?: string,
  ) {
    try {
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
        throw new BadRequestException(
          `Order already has an active ${type} task`,
        );
      }

      return await this.prisma.$transaction(async (tx) => {
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

        const newStatus =
          type === DispatchTaskType.Pickup
            ? OrderStatus.PickupAssigned
            : OrderStatus.DeliveryAssigned;

        await this.workflowService.transition(
          order as any,
          newStatus,
          UserType.BusinessOwner,
          {
            notes: `Manually assigned ${type} to dispatch rider ${riderId}`,
            actorUserId: actorUserId || undefined,
          },
          tx,
        );

        return task;
      });
    } catch (e) {
      console.error('AssignDispatchRiderUseCase ERROR:', e);
      throw e;
    }
  }
}
