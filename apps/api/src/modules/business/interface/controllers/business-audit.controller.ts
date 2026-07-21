import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interface/guards/roles.guard';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { CurrentUser } from '../../../identity/interface/decorators/current-user.decorator';
import { BusinessAuditUseCases } from '../../application/use-cases/business-audit.use-cases';
import { RequirePermissions } from '../../../identity/interface/decorators/require-permissions.decorator';

@Controller('business/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.BusinessOwner, UserType.Staff)
@RequirePermissions('audit:view')
export class BusinessAuditController {
  constructor(private readonly auditUseCases: BusinessAuditUseCases) {}

  @Get()
  async getAuditLogs(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditUseCases.getBusinessAuditLogs(
      user.businessId,
      page,
      limit,
      { actorId, action, entityType, startDate, endDate },
    );
  }
}
