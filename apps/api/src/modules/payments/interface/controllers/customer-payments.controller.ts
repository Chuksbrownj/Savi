import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { InitiatePaymentUseCase } from '../../application/use-cases/initiate-payment.use-case';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interface/guards/roles.guard';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export class InitiatePaymentDto {
  provider?: string;
}

@ApiTags('Payments')
@Controller('customer/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomerPaymentsController {
  constructor(private readonly initiatePaymentUseCase: InitiatePaymentUseCase) {}

  @Post(':id/payments/initiate')
  @Roles(UserType.Customer)
  @ApiOperation({ summary: 'Initiate payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment initiated' })
  async initiatePayment(
    @Param('id') orderId: string,
    @Body() dto: InitiatePaymentDto,
    @Req() req: any,
  ) {
    const customerId = req.user.customerProfileId; // Assuming customerProfileId is available in req.user
    
    return this.initiatePaymentUseCase.execute({
      orderId,
      customerId,
      provider: dto.provider,
    });
  }
}
