import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interface/guards/roles.guard';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { CurrentUser } from '../../../identity/interface/decorators/current-user.decorator';
import { GenerateReportUseCase } from '../../application/use-cases/generate-report.use-case';

@Controller('business/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.BusinessOwner, UserType.Staff)
export class BusinessReportsController {
  constructor(private readonly generateReportUseCase: GenerateReportUseCase) {}

  @Get('orders')
  async exportOrders(
    @CurrentUser() user: any,
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
  ) {
    if (!['csv', 'xlsx'].includes(format)) {
      throw new BadRequestException('Format must be csv or xlsx');
    }
    return this.generateReportUseCase.requestOrderReport(
      user.businessId,
      { startDate, endDate, status, branchId },
      format,
    );
  }

  @Get('settlements')
  async exportSettlements(
    @CurrentUser() user: any,
    @Query('format') format: 'csv' = 'csv',
  ) {
    if (format !== 'csv') {
      throw new BadRequestException('Format must be csv');
    }
    return this.generateReportUseCase.requestSettlementReport(user.businessId, format);
  }

  @Get('revenue')
  async exportRevenue(
    @CurrentUser() user: any,
    @Query('format') format: 'pdf' = 'pdf',
  ) {
    if (format !== 'pdf') {
      throw new BadRequestException('Format must be pdf');
    }
    return this.generateReportUseCase.requestRevenueReport(user.businessId, format);
  }

  @Get(':jobId/status')
  async getReportStatus(@Param('jobId') jobId: string) {
    return this.generateReportUseCase.getReportStatus(jobId);
  }
}
