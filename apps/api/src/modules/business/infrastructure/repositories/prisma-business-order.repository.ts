import { Injectable } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  BusinessOrderDetails,
  IBusinessOrderRepository,
} from '../../domain/repositories/business-order.repository.interface';

@Injectable()
export class PrismaBusinessOrderRepository implements IBusinessOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrders(
    businessId: string,
    params: {
      skip?: number;
      take?: number;
      status?: OrderStatus;
      branchId?: string;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ data: Order[]; total: number }> {
    const where: any = { businessId };

    if (params.status) where.status = params.status;
    if (params.branchId) where.branchId = params.branchId;
    if (params.customerId) where.customerId = params.customerId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total };
  }

  async findById(
    businessId: string,
    orderId: string,
  ): Promise<BusinessOrderDetails | null> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, businessId },
      include: {
        customer: {
          include: {
            user: {
              select: { fullName: true, email: true, phone: true },
            },
          },
        },
        items: true,
        payments: true,
        dispatchTasks: true,
        ratings: true,
        supportTickets: true,
        timeline: true,
      },
    });

    return order as unknown as BusinessOrderDetails | null;
  }

  async updateStatus(
    businessId: string,
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    return this.prisma.order.update({
      where: { id: orderId, businessId },
      data: { status },
    });
  }
}
