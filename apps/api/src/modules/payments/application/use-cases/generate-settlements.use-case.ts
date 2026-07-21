import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { SettlementStatus, DispatchTaskStatus } from '@prisma/client';

export interface GenerateSettlementsCommand {
  businessId: string;
  periodStart: Date;
  periodEnd: Date;
}

@Injectable()
export class GenerateSettlementsUseCase {
  private readonly logger = new Logger(GenerateSettlementsUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: GenerateSettlementsCommand) {
    const { businessId, periodStart, periodEnd } = command;

    this.logger.log(`Generating settlements for business ${businessId} from ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);

    // Get the dispatch fee configuration
    const feeConfig = await this.prisma.dispatchFeeConfig.findUnique({
      where: { businessId },
    });

    const flatFeePerJob = feeConfig ? Number(feeConfig.flatFeePerJob) : 5.0; // Fallback default fee
    const currency = feeConfig ? feeConfig.currency : 'USD';

    // Find all completed dispatch tasks in the period
    const completedTasks = await this.prisma.dispatchTask.findMany({
      where: {
        businessId,
        status: DispatchTaskStatus.Completed,
        completedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    if (completedTasks.length === 0) {
      this.logger.log('No completed tasks found in this period.');
      return { generated: 0 };
    }

    // Group tasks by riderId
    const tasksByRider = new Map<string, number>();
    for (const task of completedTasks) {
      if (!task.riderId) continue;
      const count = tasksByRider.get(task.riderId) || 0;
      tasksByRider.set(task.riderId, count + 1);
    }

    let generatedCount = 0;

    // Create a Settlement for each rider
    await this.prisma.$transaction(async (tx: any) => {
      for (const [riderId, jobCount] of tasksByRider.entries()) {
        const totalAmount = jobCount * flatFeePerJob;

        // Check if settlement already exists for this rider and period to avoid duplicates
        const existingSettlement = await tx.settlement.findFirst({
          where: {
            riderId,
            businessId,
            periodStart,
            periodEnd,
          },
        });

        if (!existingSettlement) {
          await tx.settlement.create({
            data: {
              riderId,
              businessId,
              periodStart,
              periodEnd,
              totalJobs: jobCount,
              totalAmount,
              status: SettlementStatus.Pending,
            },
          });
          generatedCount++;
        }
      }
    });

    this.logger.log(`Generated ${generatedCount} settlements.`);
    return { generated: generatedCount };
  }
}
