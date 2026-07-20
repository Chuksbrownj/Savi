import { Prisma } from '@prisma/client';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IBusinessSettlementRepository } from '../../domain/repositories/business-promo-settle.repository.interface';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class ManageSettlementsUseCases {
  constructor(
    @Inject('IBusinessSettlementRepository')
    private readonly repository: IBusinessSettlementRepository,
    private readonly prisma: PrismaService,
  ) {}

  async generateSettlement(
    businessId: string,
    data: { riderId: string; periodStart: string; periodEnd: string },
  ) {
    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);

    // Find all completed dispatch tasks for this rider in the period
    const tasks = await this.prisma.dispatchTask.findMany({
      where: {
        businessId,
        riderId: data.riderId,
        status: 'Completed',
        completedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        order: {
          select: { total: true }, // Simplified. Typically you calculate per-job payout.
        },
      },
    });

    if (tasks.length === 0) {
      throw new BadRequestException(
        'No completed tasks found in this period for the rider',
      );
    }

    // Simplified payout calculation: 500 NGN per task.
    // Real implementation would pull this from business/rider specific settings.
    const payoutPerTask = 500;
    const totalAmount = tasks.length * payoutPerTask;

    return this.repository.createSettlement({
      businessId,
      riderId: data.riderId,
      periodStart,
      periodEnd,
      totalJobs: tasks.length,
      totalAmount: new Prisma.Decimal(totalAmount),
      status: 'Pending',
      paidAt: null,
      reference: null,
    });
  }

  async findSettlements(businessId: string, status?: string) {
    const filters = status ? { status } : {};
    return this.repository.findSettlements(businessId, filters);
  }
}
