import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interface/guards/roles.guard';
import { RequirePermissions } from '../../../identity/interface/decorators/require-permissions.decorator';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType } from '@prisma/client';

import { ManageServicesPricingUseCases } from '../../application/use-cases/manage-services-pricing.use-cases';

@ApiTags('Business Services & Pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.BusinessOwner, UserType.Staff)
@Controller('business')
export class BusinessPricingController {
  constructor(private readonly servicePricing: ManageServicesPricingUseCases) {}

  @Post('services')
  @RequirePermissions('pricing:manage')
  @ApiOperation({ summary: 'Create a new laundry service type' })
  async createService(@Request() req: any, @Body() body: any) {
    return this.servicePricing.createService(req.user.businessId, body);
  }

  @Get('services')
  @RequirePermissions('pricing:manage')
  @ApiOperation({ summary: 'List all services for this business' })
  async getServices(@Request() req: any) {
    return this.servicePricing.findServices(req.user.businessId);
  }

  @Patch('services/:id')
  @RequirePermissions('pricing:manage')
  @ApiOperation({ summary: 'Update a laundry service' })
  async updateService(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.servicePricing.updateService(req.user.businessId, id, body);
  }

  @Delete('services/:id')
  @RequirePermissions('pricing:manage')
  @ApiOperation({ summary: 'Delete a laundry service' })
  async deleteService(@Request() req: any, @Param('id') id: string) {
    return this.servicePricing.deleteService(req.user.businessId, id);
  }

  @Post('pricing')
  @RequirePermissions('pricing:manage')
  @ApiOperation({ summary: 'Create a pricing tier for a service' })
  async createPricing(@Request() req: any, @Body() body: any) {
    return this.servicePricing.createPricing(req.user.businessId, body);
  }

  @Get('services/:serviceId/pricing')
  @RequirePermissions('pricing:manage')
  @ApiOperation({ summary: 'List pricing for a specific service' })
  async getPricing(@Request() req: any, @Param('serviceId') serviceId: string) {
    return this.servicePricing.findPricingByService(
      req.user.businessId,
      serviceId,
    );
  }

  @Patch('pricing/:id')
  @RequirePermissions('pricing:manage')
  @ApiOperation({ summary: 'Update a pricing tier' })
  async updatePricing(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.servicePricing.updatePricing(req.user.businessId, id, body);
  }

  @Delete('pricing/:id')
  @RequirePermissions('pricing:manage')
  @ApiOperation({ summary: 'Delete a pricing tier' })
  async deletePricing(@Request() req: any, @Param('id') id: string) {
    return this.servicePricing.deletePricing(req.user.businessId, id);
  }
}
