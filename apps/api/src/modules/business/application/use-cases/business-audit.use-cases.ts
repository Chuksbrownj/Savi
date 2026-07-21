import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class BusinessAuditUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async getBusinessAuditLogs(
    businessId: string,
    page: number,
    limit: number,
    filters?: {
      actorId?: string;
      action?: string;
      entityType?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const skip = (page - 1) * limit;
    
    // We scope audit logs by looking for entities that belong to the business.
    // In a production system, AuditLog might have a `businessId` column directly for faster querying.
    // Assuming we want to filter generic AuditLogs, we can either add businessId to the schema,
    // or we filter by actorUserId if we know the staff of this business.
    // For now, let's assume we filter by actors that belong to this business.
    
    const staffUserIds = await this.prisma.staffProfile.findMany({
      where: { businessId },
      select: { userId: true }
    });
    
    const userIds = staffUserIds.map(s => s.userId);

    const where: any = {
      actorUserId: { in: userIds } // Scope to actions performed by staff of this business
    };

    if (filters?.actorId) where.actorUserId = filters.actorId;
    if (filters?.action) where.action = filters.action;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actorUser: {
            select: { fullName: true, email: true }
          }
        }
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return { items, total };
  }
}
