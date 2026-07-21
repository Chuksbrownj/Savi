import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ProcessSettlementUseCase } from '../../application/use-cases/process-settlement.use-case';
import { GenerateSettlementsUseCase } from '../../application/use-cases/generate-settlements.use-case';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interface/guards/roles.guard';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export class ProcessSettlementDto {
  provider?: string;
}

export class GenerateSettlementsDto {
  periodStart!: Date;
  periodEnd!: Date;
}

@ApiTags('Settlements')
@Controller('business/settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BusinessSettlementsController {
  constructor(
    private readonly processSettlementUseCase: ProcessSettlementUseCase,
    private readonly generateSettlementsUseCase: GenerateSettlementsUseCase,
  ) {}

  @Post('generate')
  @Roles(UserType.BusinessOwner, UserType.Staff)
  @ApiOperation({ summary: 'Generate settlements for a period' })
  async generateSettlements(
    @Body() dto: GenerateSettlementsDto,
    @Req() req: any,
  ) {
    const businessId = req.user.businessId; 
    return this.generateSettlementsUseCase.execute({
      businessId,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
    });
  }

  @Post(':id/process')
  @Roles(UserType.BusinessOwner, UserType.Staff)
  @ApiOperation({ summary: 'Process a generated settlement' })
  @ApiResponse({ status: 200, description: 'Settlement processing initiated' })
  async processSettlement(
    @Param('id') settlementId: string,
    @Body() dto: ProcessSettlementDto,
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;
    return this.processSettlementUseCase.execute({
      settlementId,
      businessId,
      provider: dto.provider,
    });
  }
}
