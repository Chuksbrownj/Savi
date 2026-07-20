import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IBusinessOrderRepository } from '../../domain/repositories/business-order.repository.interface';
import { IBusinessDispatchRepository } from '../../domain/repositories/business-dispatch.repository.interface';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { DispatchTaskType, OrderStatus, UserType } from '@prisma/client';
import { OrderWorkflowService } from '../../../orders/domain/services/order-workflow.service';

@Injectable()
export class AutoAssignDispatchRiderUseCase {
  constructor(
    @Inject('IBusinessOrderRepository')
    private readonly orderRepository: IBusinessOrderRepository,
    @Inject('IBusinessDispatchRepository')
    private readonly dispatchRepository: IBusinessDispatchRepository,
    private readonly prisma: PrismaService,
    private readonly workflowService: OrderWorkflowService,
  ) {}

  async execute(businessId: string, orderId: string, type: DispatchTaskType) {
    const order = await this.orderRepository.findById(businessId, orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      type === DispatchTaskType.Pickup &&
      order.status !== OrderStatus.AwaitingPickupAssignment
    ) {
      throw new BadRequestException(
        `Cannot auto-assign pickup for order in status ${order.status}`,
      );
    }

    if (
      type === DispatchTaskType.Delivery &&
      order.status !== OrderStatus.ReadyForDelivery
    ) {
      throw new BadRequestException(
        `Cannot auto-assign delivery for order in status ${order.status}`,
      );
    }

    // Check if task already exists
    const existingTask = await this.prisma.dispatchTask.findFirst({
      where: {
        orderId,
        businessId,
        type,
        status: { in: ['Assigned', 'InProgress'] },
      },
    });

    if (existingTask) {
      throw new BadRequestException(
        `An active ${type} task already exists for this order`,
      );
    }

    // Determine target location coordinates
    let targetLat: number | null = null;
    let targetLng: number | null = null;

    // Load necessary address details
    // Assuming we fetch it via prisma directly to get the address relation
    const orderWithAddresses = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pickupAddress: true,
        deliveryAddress: true,
      },
    });

    if (type === DispatchTaskType.Pickup && orderWithAddresses?.pickupAddress) {
      targetLat = orderWithAddresses.pickupAddress.lat;
      targetLng = orderWithAddresses.pickupAddress.lng;
    } else if (
      type === DispatchTaskType.Delivery &&
      orderWithAddresses?.deliveryAddress
    ) {
      targetLat = orderWithAddresses.deliveryAddress.lat;
      targetLng = orderWithAddresses.deliveryAddress.lng;
    }

    // Find all active and available riders for the business
    const availableRiders = await this.prisma.dispatchRiderProfile.findMany({
      where: {
        businessId,
        isActive: true,
        availability: 'Online',
      },
    });

    if (availableRiders.length === 0) {
      throw new BadRequestException(
        'No available dispatch riders found for auto-assignment',
      );
    }

    let selectedRiderId = availableRiders[0].id; // Fallback to the first available rider

    // Proximity logic
    if (targetLat !== null && targetLng !== null) {
      let closestDistance = Infinity;

      for (const rider of availableRiders) {
        if (rider.currentLat !== null && rider.currentLng !== null) {
          const distance = this.calculateHaversineDistance(
            targetLat,
            targetLng,
            rider.currentLat,
            rider.currentLng,
          );

          if (distance < closestDistance) {
            closestDistance = distance;
            selectedRiderId = rider.id;
          }
        }
      }
    }

    // Proceed with assignment for the selected rider
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const task = await tx.dispatchTask.create({
        data: {
          businessId,
          orderId,
          riderId: selectedRiderId,
          type,
          status: 'Assigned',
        },
      });

      return task;
    });

    const newStatus =
      type === DispatchTaskType.Pickup
        ? OrderStatus.PickupAssigned
        : OrderStatus.DeliveryAssigned;

    const transitionedOrder = await this.workflowService.transition(
      order as any,
      newStatus,
      'System',
      { notes: `Auto-assigned ${type} to dispatch rider ${selectedRiderId}` },
    );

    return transitionedOrder;
  }

  /**
   * Calculates the great-circle distance between two points on the Earth's surface using the Haversine formula.
   * Returns distance in kilometers.
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRadians = (deg: number) => deg * (Math.PI / 180);

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
