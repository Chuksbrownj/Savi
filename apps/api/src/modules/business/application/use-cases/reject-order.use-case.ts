import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IBusinessOrderRepository } from '../../domain/repositories/business-order.repository.interface';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class RejectOrderUseCase {
  constructor(
    @Inject('IBusinessOrderRepository')
    private readonly orderRepository: IBusinessOrderRepository,
    private readonly prisma: PrismaService,
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.Cancelled },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: OrderStatus.Cancelled,
          notes: `Order rejected by business: ${reason}`,
        },
      });

      return updatedOrder;
    });

    // TODO: Phase 9 notifies customer

    return updated;
  }
}
