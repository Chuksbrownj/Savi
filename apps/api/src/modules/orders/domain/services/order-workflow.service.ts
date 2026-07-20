import { Injectable, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  Order,
  OrderStatus,
  UserType,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

export type ActorType = UserType | 'System';

export interface WorkflowTransitionContext {
  notes?: string;
  actorUserId?: string;
  applicableStatuses?: OrderStatus[];
}

export interface TransitionRule {
  from: OrderStatus[];
  to: OrderStatus;
  allowedActors: ActorType[];
  guard?: (
    order: Order,
    context: WorkflowTransitionContext,
  ) => boolean | Promise<boolean>;
}

@Injectable()
export class OrderWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Explicit directed graph definition for Order transitions
  private readonly transitions: TransitionRule[] = [
    {
      from: [OrderStatus.Draft],
      to: OrderStatus.AwaitingPayment,
      allowedActors: [UserType.Customer],
      guard: (order) => true,
    },
    {
      from: [OrderStatus.AwaitingPayment],
      to: OrderStatus.PaymentConfirmed,
      allowedActors: ['System', UserType.BusinessOwner, UserType.Staff],
      guard: (order) =>
        order.paymentStatus === PaymentStatus.Paid ||
        order.paymentMethod === PaymentMethod.PayOnDelivery,
    },
    {
      from: [OrderStatus.PaymentConfirmed],
      to: OrderStatus.AwaitingPickupAssignment,
      allowedActors: ['System', UserType.BusinessOwner, UserType.Staff],
    },
    {
      from: [OrderStatus.AwaitingPickupAssignment],
      to: OrderStatus.PickupAssigned,
      allowedActors: [UserType.BusinessOwner, UserType.Staff],
    },
    {
      from: [OrderStatus.PickupAssigned],
      to: OrderStatus.PickupInProgress,
      allowedActors: [UserType.DispatchRider],
    },
    {
      from: [OrderStatus.PickupInProgress],
      to: OrderStatus.LaundryReceived,
      allowedActors: [UserType.DispatchRider],
    },
    {
      from: [OrderStatus.LaundryReceived],
      to: OrderStatus.Sorting,
      allowedActors: [UserType.BusinessOwner, UserType.Staff],
    },
    {
      from: [OrderStatus.Sorting],
      to: OrderStatus.Washing,
      allowedActors: [UserType.BusinessOwner, UserType.Staff],
    },
    {
      from: [OrderStatus.Washing],
      to: OrderStatus.Drying,
      allowedActors: [UserType.BusinessOwner, UserType.Staff],
    },
    {
      from: [OrderStatus.Drying],
      to: OrderStatus.Ironing,
      allowedActors: [UserType.BusinessOwner, UserType.Staff],
    },
    {
      from: [OrderStatus.Ironing],
      to: OrderStatus.Packaging,
      allowedActors: [UserType.BusinessOwner, UserType.Staff],
    },
    {
      from: [OrderStatus.Packaging],
      to: OrderStatus.ReadyForDelivery,
      allowedActors: [UserType.BusinessOwner, UserType.Staff],
    },
    // Allows skipping straight to ReadyForDelivery if stages are not applicable
    {
      from: [
        OrderStatus.LaundryReceived,
        OrderStatus.Sorting,
        OrderStatus.Washing,
        OrderStatus.Drying,
        OrderStatus.Ironing,
      ],
      to: OrderStatus.ReadyForDelivery,
      allowedActors: [UserType.BusinessOwner, UserType.Staff],
    },
    {
      from: [OrderStatus.ReadyForDelivery],
      to: OrderStatus.DeliveryAssigned,
      allowedActors: [UserType.BusinessOwner, UserType.Staff],
    },
    {
      from: [OrderStatus.DeliveryAssigned],
      to: OrderStatus.OutForDelivery,
      allowedActors: [UserType.DispatchRider],
    },
    {
      from: [OrderStatus.OutForDelivery],
      to: OrderStatus.Delivered,
      allowedActors: [UserType.DispatchRider],
    },
    {
      from: [OrderStatus.Delivered],
      to: OrderStatus.Completed,
      allowedActors: [UserType.Customer, 'System'],
    },
    // Cancellations
    {
      from: [
        OrderStatus.Draft,
        OrderStatus.AwaitingPayment,
        OrderStatus.PaymentConfirmed,
        OrderStatus.AwaitingPickupAssignment,
      ],
      to: OrderStatus.Cancelled,
      allowedActors: [
        UserType.Customer,
        UserType.BusinessOwner,
        UserType.Staff,
        'System',
      ],
    },
    {
      from: [
        OrderStatus.PickupAssigned,
        OrderStatus.PickupInProgress,
        OrderStatus.LaundryReceived,
        OrderStatus.Sorting,
        OrderStatus.Washing,
        OrderStatus.Drying,
        OrderStatus.Ironing,
        OrderStatus.Packaging,
        OrderStatus.ReadyForDelivery,
        OrderStatus.DeliveryAssigned,
        OrderStatus.OutForDelivery,
        OrderStatus.Delivered,
      ],
      to: OrderStatus.Cancelled,
      allowedActors: [UserType.BusinessOwner, UserType.Staff, 'System'],
    },
  ];

  async canTransition(
    order: Order,
    toStatus: OrderStatus,
    actor: ActorType,
    context: WorkflowTransitionContext = {},
  ): Promise<boolean> {
    const rule = this.transitions.find(
      (r) => r.from.includes(order.status) && r.to === toStatus,
    );
    if (!rule) return false;
    if (!rule.allowedActors.includes(actor)) return false;
    if (rule.guard) {
      return await rule.guard(order, context);
    }
    return true;
  }

  async transition(
    order: Order,
    toStatus: OrderStatus,
    actor: ActorType,
    context: WorkflowTransitionContext = {},
    prismaTx?: any,
  ): Promise<Order> {
    const canTrans = await this.canTransition(order, toStatus, actor, context);
    if (!canTrans) {
      throw new ConflictException(
        `Invalid transition from ${order.status} to ${toStatus} by actor ${actor}`,
      );
    }

    const tx = prismaTx || this.prisma;

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: toStatus },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: toStatus,
        actorType: actor,
        actorUserId: context.actorUserId || null,
        notes: context.notes || null,
      },
    });

    // Also update legacy OrderTimeline to not break Phase 4 stuff that relies on it
    await tx.orderTimeline.create({
      data: {
        orderId: order.id,
        status: toStatus,
        notes: context.notes || null,
      },
    });

    this.eventEmitter.emit('order.status.changed', {
      orderId: order.id,
      fromStatus: order.status,
      toStatus: toStatus,
      actor,
      context,
    });

    return updatedOrder;
  }

  getAvailableTransitions(order: Order, actor: ActorType): OrderStatus[] {
    return this.transitions
      .filter(
        (r) => r.from.includes(order.status) && r.allowedActors.includes(actor),
      )
      .map((r) => r.to);
  }
}
