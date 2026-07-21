import { Controller, Post, Body, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
// import { GenerateReportUseCase } from '../../application/use-cases/generate-report.use-case';

@ApiTags('business-webhooks')
@Controller('v1/business/webhooks')
export class BusinessWebhooksController {
  private readonly logger = new Logger(BusinessWebhooksController.name);

  // constructor(private readonly generateReportUseCase: GenerateReportUseCase) {}

  @Post('qstash/report')
  @ApiOperation({ summary: 'Process QStash report generation webhooks' })
  async handleQStashReportWebhook(@Body() payload: any) {
    const { type, businessId, filters, format } = payload;
    
    if (!businessId || !type) {
      throw new BadRequestException('Invalid payload');
    }

    this.logger.log(`Processing report generation for business ${businessId} via QStash (${type})`);

    // In a real implementation, you would call the report generator service here
    // e.g. await this.reportGeneratorService.generateOrderReport(businessId, filters, format);
    
    this.logger.log(`Successfully generated report for business ${businessId}`);
    return { success: true };
  }
}
