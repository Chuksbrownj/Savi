import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IBusinessOrderRepository } from '../../domain/repositories/business-order.repository.interface';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class ApproveOrderUseCase {
  constructor(
    @Inject('IBusinessOrderRepository')
    private readonly orderRepository: IBusinessOrderRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(businessId: string, orderId: string) {
    const order = await this.orderRepository.findById(businessId, orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // A business can typically only approve orders that are in Draft or similar pre-processing state,
    // but the prompt says: "moves an order from PaymentConfirmed to AwaitingPickupAssignment"
    // So order must be PaymentConfirmed, OR if they're bypassing it based on PayOnDelivery, it might be in AwaitingPayment.
    // Let's assume the state machine requires us to transition it to AwaitingPickupAssignment.

    if (order.status === OrderStatus.AwaitingPickupAssignment) {
      throw new BadRequestException(
        'Order is already approved and awaiting pickup assignment',
      );
    }

    if (
      order.status !== OrderStatus.PaymentConfirmed &&
      order.status !== OrderStatus.AwaitingPayment &&
      order.status !== OrderStatus.Draft
    ) {
      throw new BadRequestException(
        `Cannot approve order in status ${order.status}`,
      );
    }

    // Payment validation rules
    const canApprove =
      order.paymentMethod === PaymentMethod.PayOnDelivery ||
      (order.paymentMethod === PaymentMethod.Full &&
        order.paymentStatus === PaymentStatus.Paid) ||
      (order.paymentMethod === PaymentMethod.Part &&
        (order.paymentStatus === PaymentStatus.PartiallyPaid ||
          order.paymentStatus === PaymentStatus.Paid));

    if (!canApprove) {
      throw new BadRequestException(
        'Payment status does not meet requirements for approval',
      );
    }

    // We use Prisma directly for transaction to create timeline entry
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.AwaitingPickupAssignment },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: OrderStatus.AwaitingPickupAssignment,
          notes: 'Order approved by business operator',
        },
      });

      return updatedOrder;
    });

    return updated;
  }
}
