import { Injectable } from '@nestjs/common';
import { QStashService } from '../../../../infrastructure/qstash/qstash.service';

@Injectable()
export class GenerateReportUseCase {
  constructor(
    private readonly qstashService: QStashService,
  ) {}

  async requestOrderReport(businessId: string, filters: any, format: 'csv' | 'xlsx') {
    const result = await this.qstashService.publishWebhook('/api/v1/business/webhooks/qstash/report', {
      type: 'generate-order-report',
      businessId,
      filters,
      format,
    });
    return { jobId: result.messageId, status: 'Processing' };
  }

  async requestSettlementReport(businessId: string, format: 'csv') {
    const result = await this.qstashService.publishWebhook('/api/v1/business/webhooks/qstash/report', {
      type: 'generate-settlement-report',
      businessId,
      format,
    });
    return { jobId: result.messageId, status: 'Processing' };
  }

  async requestRevenueReport(businessId: string, format: 'pdf') {
    const result = await this.qstashService.publishWebhook('/api/v1/business/webhooks/qstash/report', {
      type: 'generate-revenue-report',
      businessId,
      format,
    });
    return { jobId: result.messageId, status: 'Processing' };
  }

  async getReportStatus(jobId: string) {
    // With Serverless, we rely on the webhook to write the final URL to the database.
    // In a full implementation, we would query the database here using the jobId.
    return { status: 'Processing', note: 'Check your email for the report download link' };
  }
}
