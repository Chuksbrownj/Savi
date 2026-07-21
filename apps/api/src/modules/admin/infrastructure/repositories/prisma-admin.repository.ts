import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

export interface IAdminRepository {
  getBusinesses(
    skip: number,
    take: number,
    search?: string,
  ): Promise<{ items: any[]; total: number }>;
  updateBusinessStatus(id: string, isActive: boolean): Promise<any>;
  getSystemAuditLogs(
    skip: number,
    take: number,
  ): Promise<{ items: any[]; total: number }>;
  getSystemHealthMetrics(): Promise<any>;
}

@Injectable()
export class PrismaAdminRepository implements IAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBusinesses(skip: number, take: number, search?: string) {
    const where = search
      ? {
          name: { contains: search, mode: 'insensitive' as const },
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      }),
      this.prisma.business.count({ where }),
    ]);

    return { items, total };
  }

  async updateBusinessStatus(id: string, isActive: boolean) {
    return this.prisma.business.update({
      where: { id },
      data: { isActive },
    });
  }

  async getSystemAuditLogs(skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          actorUser: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return { items, total };
  }

  async getSystemHealthMetrics() {
    // Basic metrics aggregation
    const [
      totalBusinesses,
      totalOrdersProcessed,
      totalUsers,
    ] = await Promise.all([
      this.prisma.business.count(),
      this.prisma.order.count({
        where: { status: { in: ['Completed'] } },
      }),
      this.prisma.user.count(),
    ]);

    return {
      totalBusinesses,
      totalOrdersProcessed,
      totalUsers,
    };
  }
}
