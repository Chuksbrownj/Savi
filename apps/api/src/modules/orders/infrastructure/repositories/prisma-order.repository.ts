import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Order, OrderStatus } from '@prisma/client';
import {
  IOrderRepository,
  OrderWithDetails,
} from '../../domain/repositories/order.repository.interface';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<OrderWithDetails> {
    return this.prisma.order.create({
      data,
      include: { items: true, timeline: true },
    }) as unknown as Promise<OrderWithDetails>;
  }

  async findById(id: string): Promise<OrderWithDetails | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true, timeline: { orderBy: { createdAt: 'desc' } } },
    }) as unknown as Promise<OrderWithDetails | null>;
  }

  async findByCustomerId(customerId: string): Promise<OrderWithDetails[]> {
    return this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, timeline: { orderBy: { createdAt: 'desc' } } },
    }) as unknown as Promise<OrderWithDetails[]>;
  }

  async update(id: string, data: Partial<Order>): Promise<OrderWithDetails> {
    return this.prisma.order.update({
      where: { id },
      data,
      include: { items: true, timeline: { orderBy: { createdAt: 'desc' } } },
    }) as unknown as Promise<OrderWithDetails>;
  }

  async addTimelineEvent(
    orderId: string,
    status: OrderStatus,
    notes?: string,
  ): Promise<void> {
    await this.prisma.orderTimeline.create({
      data: {
        orderId,
        status,
        notes,
      },
    });
  }

  async updateItems(orderId: string, items: any[]): Promise<OrderWithDetails> {
    // Delete existing and insert new
    await this.prisma.orderItem.deleteMany({
      where: { orderId },
    });

    await this.prisma.orderItem.createMany({
      data: items.map((item) => ({ ...item, orderId })),
    });

    return this.findById(orderId) as Promise<OrderWithDetails>;
  }
}
