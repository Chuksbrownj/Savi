import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  NotImplementedException,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interface/guards/roles.guard';
import { RequirePermissions } from '../../../identity/interface/decorators/require-permissions.decorator';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType } from '@prisma/client';

import { BusinessCustomersUseCases } from '../../application/use-cases/business-customers.use-cases';

@ApiTags('Business Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.BusinessOwner, UserType.Staff)
@Controller('business/customers')
export class BusinessCustomersController {
  constructor(private readonly customers: BusinessCustomersUseCases) {}

  @Get()
  @RequirePermissions('customers:read')
  @ApiOperation({
    summary: 'List customers who have ordered from this business',
  })
  async listCustomers(@Request() req: any) {
    return this.customers.listCustomers(req.user.businessId);
  }

  @Get(':id')
  @RequirePermissions('customers:read')
  @ApiOperation({ summary: 'Get details of a specific customer' })
  async getCustomerDetails(@Request() req: any, @Param('id') id: string) {
    return this.customers.getCustomerDetails(req.user.businessId, id);
  }

  @Post(':id/note')
  @RequirePermissions('customers:manage')
  @ApiOperation({
    summary: 'Add a note to a customer profile (Pending schema update)',
  })
  async addNote(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    throw new NotImplementedException(
      'Adding notes to customers requires a schema update for CustomerNote',
    );
  }
}
