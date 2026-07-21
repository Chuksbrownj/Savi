import { Controller, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { OrderWorkflowService } from '../../domain/services/order-workflow.service';
import { OrderStatus } from '@prisma/client';

@ApiTags('orders-webhooks')
@Controller('v1/orders/webhooks')
export class OrdersWebhooksController {
  private readonly logger = new Logger(OrdersWebhooksController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowService: OrderWorkflowService,
  ) {}

  @Post('qstash/auto-complete')
  @ApiOperation({ summary: 'Auto-complete stale orders via QStash cron' })
  async handleQStashAutoComplete() {
    this.logger.log('Running Order Auto Completion Job via Webhook...');

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

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
            notes: 'Auto-completed after 48 hours without customer confirmation',
          },
        );
        this.logger.log(`Auto-completed order ${order.id}`);
      } catch (error: any) {
        this.logger.error(
          `Failed to auto-complete order ${order.id}: ${error.message}`,
        );
      }
    }

    return { success: true, processed: staleOrders.length };
  }
}
