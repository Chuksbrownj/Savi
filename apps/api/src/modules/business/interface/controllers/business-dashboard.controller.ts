import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interface/guards/roles.guard';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { CurrentUser } from '../../../identity/interface/decorators/current-user.decorator';
import { AnalyticsDashboardUseCases } from '../../application/use-cases/analytics-dashboard.use-cases';

@Controller('business/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.BusinessOwner, UserType.Staff)
@UseInterceptors(CacheInterceptor)
@CacheTTL(60) // 60 seconds cache TTL
export class BusinessDashboardController {
  constructor(private readonly dashboardUseCases: AnalyticsDashboardUseCases) {}

  @Get('summary')
  async getSummary(
    @CurrentUser() user: any,
    @Query('period') period: 'today' | 'week' | 'month' = 'today',
  ) {
    const businessId = user.businessId; // Assumes AuthGuard injects businessId for staff/owners
    return this.dashboardUseCases.getDashboardSummary(businessId, period);
  }

  @Get('orders-trend')
  async getOrdersTrend(
    @CurrentUser() user: any,
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
    @Query('branchId') branchId?: string,
  ) {
    return this.dashboardUseCases.getOrdersTrend(user.businessId, period, branchId);
  }

  @Get('service-breakdown')
  async getServiceBreakdown(@CurrentUser() user: any) {
    return this.dashboardUseCases.getServiceBreakdown(user.businessId);
  }

  @Get('rider-performance')
  async getRiderPerformance(@CurrentUser() user: any) {
    return this.dashboardUseCases.getRiderPerformance(user.businessId);
  }

  @Get('branch-performance')
  async getBranchPerformance(@CurrentUser() user: any) {
    return this.dashboardUseCases.getBranchPerformance(user.businessId);
  }

  @Get('customer-insights')
  async getCustomerInsights(@CurrentUser() user: any) {
    return this.dashboardUseCases.getCustomerInsights(user.businessId);
  }
}
