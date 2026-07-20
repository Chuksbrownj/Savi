import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { OrderWorkflowService } from '../../domain/services/order-workflow.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
@Processor('order-auto-completion')
export class OrderAutoCompletionProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderAutoCompletionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowService: OrderWorkflowService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log('Running OrderAutoCompletionProcessor...');

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Find orders that have been in Delivered state for > 48 hours
    // To do this, we can look at OrderStatusHistory where toStatus = Delivered and createdAt <= 48h ago
    // Or just look at orders where status is Delivered and updatedAt <= 48h ago
    const staleOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.Delivered,
        updatedAt: {
          lte: fortyEightHoursAgo,
        },
      },
    });

    this.logger.log(`Found ${staleOrders.length} orders to auto-complete.`);

    for (const order of staleOrders) {
      try {
        await this.workflowService.transition(
          order,
          OrderStatus.Completed,
          'System',
          {
            notes:
              'Auto-completed after 48 hours without customer confirmation',
          },
        );
        this.logger.log(`Auto-completed order ${order.id}`);
      } catch (error: any) {
        this.logger.error(
          `Failed to auto-complete order ${order.id}: ${error.message}`,
        );
      }
    }
  }
}
