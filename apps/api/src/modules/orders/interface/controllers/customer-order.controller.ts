import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interface/guards/roles.guard';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType } from '@prisma/client';

import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { UpdateDraftOrderUseCase } from '../../application/use-cases/update-draft-order.use-case';
import { ApplyPromotionUseCase } from '../../application/use-cases/apply-promotion.use-case';
import { SelectPaymentMethodUseCase } from '../../application/use-cases/select-payment-method.use-case';
import { GetCustomerOrdersUseCase } from '../../application/use-cases/get-customer-orders.use-case';
import { GetCustomerOrderDetailsUseCase } from '../../application/use-cases/get-customer-order-details.use-case';
import { GetOrderTimelineUseCase } from '../../application/use-cases/get-order-timeline.use-case';
import { ConfirmOrderReceiptUseCase } from '../../application/use-cases/confirm-order-receipt.use-case';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';
import { RateOrderUseCase } from '../../application/use-cases/rate-order.use-case';

import {
  CreateOrderDto,
  ApplyPromotionDto,
  SelectPaymentMethodDto,
  RateOrderDto,
} from '../../application/dtos/order.dto';

@ApiTags('Customer Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.Customer)
@Controller('customer/orders')
export class CustomerOrderController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly updateDraft: UpdateDraftOrderUseCase,
    private readonly applyPromo: ApplyPromotionUseCase,
    private readonly selectPayment: SelectPaymentMethodUseCase,
    private readonly getOrders: GetCustomerOrdersUseCase,
    private readonly getOrderDetails: GetCustomerOrderDetailsUseCase,
    private readonly getTimeline: GetOrderTimelineUseCase,
    private readonly confirmReceipt: ConfirmOrderReceiptUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
    private readonly rateOrder: RateOrderUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a draft order' })
  async create(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.createOrder.execute(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customer orders' })
  async list(@Request() req: any) {
    return this.getOrders.execute(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  async getDetails(@Request() req: any, @Param('id') id: string) {
    return this.getOrderDetails.execute(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft order' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.updateDraft.execute(id, req.user.userId, dto);
  }

  @Post(':id/apply-promotion')
  @ApiOperation({ summary: 'Apply promotion to draft order' })
  async applyPromotion(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ApplyPromotionDto,
  ) {
    return this.applyPromo.execute(id, req.user.userId, dto);
  }

  @Post(':id/payment-method')
  @ApiOperation({
    summary: 'Select payment method and transition to awaiting payment',
  })
  async selectPaymentMethod(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SelectPaymentMethodDto,
  ) {
    return this.selectPayment.execute(id, req.user.userId, dto);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get order timeline' })
  async timeline(@Request() req: any, @Param('id') id: string) {
    return this.getTimeline.execute(id, req.user.userId);
  }

  @Post(':id/confirm-receipt')
  @ApiOperation({ summary: 'Confirm receipt of a delivered order' })
  async confirm(@Request() req: any, @Param('id') id: string) {
    return this.confirmReceipt.execute(id, req.user.userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  async cancel(@Request() req: any, @Param('id') id: string) {
    return this.cancelOrder.execute(id, req.user.userId);
  }

  @Post(':id/rating')
  @ApiOperation({ summary: 'Rate completed order' })
  async rate(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: RateOrderDto,
  ) {
    return this.rateOrder.execute(id, req.user.userId, dto);
  }
}
