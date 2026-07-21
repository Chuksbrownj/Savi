import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { RefundPaymentUseCase } from '../../application/use-cases/refund-payment.use-case';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interface/guards/roles.guard';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export class RefundOrderDto {
  amount?: number;
  reason?: string;
  provider?: string;
}

@ApiTags('Refunds')
@Controller('business/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BusinessRefundsController {
  constructor(private readonly refundPaymentUseCase: RefundPaymentUseCase) {}

  @Post(':id/refund')
  @Roles(UserType.BusinessOwner, UserType.Staff)
  @ApiOperation({ summary: 'Refund a customer payment' })
  @ApiResponse({ status: 200, description: 'Refund successful' })
  async refundOrder(
    @Param('id') orderId: string,
    @Body() dto: RefundOrderDto,
    @Req() req: any,
  ) {
    const businessId = req.user.businessId; 
    
    return this.refundPaymentUseCase.execute({
      orderId,
      businessId,
      amount: dto.amount,
      reason: dto.reason,
      provider: dto.provider,
    });
  }
}
