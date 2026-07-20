import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interface/guards/roles.guard';
import { RequirePermissions } from '../../../identity/interface/decorators/require-permissions.decorator';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType } from '@prisma/client';

import { ManagePromotionsUseCases } from '../../application/use-cases/manage-promotions.use-cases';
import { ManageSettlementsUseCases } from '../../application/use-cases/manage-settlements.use-cases';

@ApiTags('Business Promotions & Settlements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.BusinessOwner, UserType.Staff)
@Controller('business')
export class BusinessPromoSettleController {
  constructor(
    private readonly promotions: ManagePromotionsUseCases,
    private readonly settlements: ManageSettlementsUseCases,
  ) {}

  @Post('promotions')
  @RequirePermissions('promotions:manage')
  @ApiOperation({ summary: 'Create a new promotion code' })
  async createPromotion(@Request() req: any, @Body() body: any) {
    return this.promotions.createPromotion(req.user.businessId, body);
  }

  @Get('promotions')
  @RequirePermissions('promotions:read')
  @ApiOperation({ summary: 'List all promotions' })
  async getPromotions(@Request() req: any) {
    return this.promotions.findPromotions(req.user.businessId);
  }

  @Patch('promotions/:id')
  @RequirePermissions('promotions:manage')
  @ApiOperation({ summary: 'Update a promotion' })
  async updatePromotion(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.promotions.updatePromotion(req.user.businessId, id, body);
  }

  @Delete('promotions/:id')
  @RequirePermissions('promotions:manage')
  @ApiOperation({ summary: 'Delete a promotion (soft delete)' })
  async deletePromotion(@Request() req: any, @Param('id') id: string) {
    return this.promotions.deletePromotion(req.user.businessId, id);
  }

  @Post('settlements/generate')
  @RequirePermissions('settlements:manage')
  @ApiOperation({ summary: 'Generate a settlement for a rider' })
  async generateSettlement(@Request() req: any, @Body() body: any) {
    return this.settlements.generateSettlement(req.user.businessId, body);
  }

  @Get('settlements')
  @RequirePermissions('settlements:read')
  @ApiOperation({ summary: 'List all settlements' })
  async getSettlements(@Request() req: any, @Query('status') status?: string) {
    return this.settlements.findSettlements(req.user.businessId, status);
  }
}
