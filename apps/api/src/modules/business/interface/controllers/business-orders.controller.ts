import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interface/guards/roles.guard';
import { RequirePermissions } from '../../../identity/interface/decorators/require-permissions.decorator';
import { Roles } from '../../../identity/interface/decorators/roles.decorator';
import { UserType } from '@prisma/client';

import { GetBusinessOrdersUseCase } from '../../application/use-cases/get-business-orders.use-case';
import { GetBusinessOrderDetailsUseCase } from '../../application/use-cases/get-business-order-details.use-case';
import { ApproveOrderUseCase } from '../../application/use-cases/approve-order.use-case';
import { RejectOrderUseCase } from '../../application/use-cases/reject-order.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { ConfirmPaymentUseCase } from '../../application/use-cases/confirm-payment.use-case';

import {
  GetBusinessOrdersQueryDto,
  RejectOrderDto,
  UpdateOrderStatusDto,
  ConfirmPaymentDto,
} from '../../application/dtos/business-order.dto';

@ApiTags('Business Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.BusinessOwner, UserType.Staff) // Only business users
@Controller('business/orders')
export class BusinessOrdersController {
  constructor(
    private readonly getOrders: GetBusinessOrdersUseCase,
    private readonly getOrderDetails: GetBusinessOrderDetailsUseCase,
    private readonly approveOrder: ApproveOrderUseCase,
    private readonly rejectOrder: RejectOrderUseCase,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
    private readonly confirmPayment: ConfirmPaymentUseCase,
  ) {}

  @Get()
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Get business orders with filtering/pagination' })
  async listOrders(
    @Request() req: any,
    @Query() query: GetBusinessOrdersQueryDto,
  ) {
    return this.getOrders.execute(req.user.businessId, {
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      status: query.status,
      branchId: query.branchId,
      customerId: query.customerId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }

  @Get(':id')
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Get full order details' })
  async getDetails(@Request() req: any, @Param('id') id: string) {
    return this.getOrderDetails.execute(req.user.businessId, id);
  }

  @Post(':id/approve')
  @RequirePermissions('orders:approve')
  @ApiOperation({
    summary: 'Approve order and move to awaiting pickup assignment',
  })
  async approve(@Request() req: any, @Param('id') id: string) {
    return this.approveOrder.execute(req.user.businessId, id);
  }

  @Post(':id/reject')
  @RequirePermissions('orders:reject')
  @ApiOperation({ summary: 'Reject an order with a reason' })
  async reject(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: RejectOrderDto,
  ) {
    return this.rejectOrder.execute(req.user.businessId, id, dto.reason);
  }

  @Post(':id/status')
  @RequirePermissions('orders:update_status')
  @ApiOperation({
    summary: 'Update order processing status (e.g., Washing, Ironing)',
  })
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.updateOrderStatus.execute(
      req.user.businessId,
      id,
      dto.status,
      dto.notes,
    );
  }

  @Post(':id/confirm-payment')
  @RequirePermissions('payments:confirm_manual')
  @ApiOperation({ summary: 'Manually confirm payment for an order' })
  async confirmManualPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.confirmPayment.execute(
      req.user.businessId,
      id,
      dto.amount,
      dto.reference,
    );
  }
}
