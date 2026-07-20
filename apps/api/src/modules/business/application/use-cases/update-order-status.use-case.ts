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
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject('IBusinessOrderRepository')
    private readonly orderRepository: IBusinessOrderRepository,
    private readonly prisma: PrismaService,
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: newStatus,
          notes: notes || `Order status updated to ${newStatus}`,
        },
      });

      return updatedOrder;
    });

    return updated;
  }
}
