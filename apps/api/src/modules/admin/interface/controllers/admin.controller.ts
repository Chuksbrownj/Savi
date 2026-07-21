import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interface/guards/roles.guard';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { AdminPlatformUseCases } from '../../application/use-cases/admin-platform.use-cases';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.Admin) // Ensures only users with UserType.Admin can access these routes
export class AdminController {
  constructor(private readonly adminUseCases: AdminPlatformUseCases) {}

  @Get('businesses')
  async getBusinesses(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.adminUseCases.getBusinesses(page, limit, search);
  }

  @Post('businesses/:id/suspend')
  async suspendBusiness(@Param('id') id: string) {
    await this.adminUseCases.suspendBusiness(id);
    return { message: 'Business suspended successfully' };
  }

  @Post('businesses/:id/reactivate')
  async reactivateBusiness(@Param('id') id: string) {
    await this.adminUseCases.reactivateBusiness(id);
    return { message: 'Business reactivated successfully' };
  }

  @Get('audit-logs')
  async getSystemAuditLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminUseCases.getSystemAuditLogs(page, limit);
  }

  @Get('system-health')
  async getSystemHealth() {
    return this.adminUseCases.getSystemHealth();
  }
}
