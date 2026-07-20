import {
  Controller,
  Post,
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
import { DispatchTaskType, UserType } from '@prisma/client';

import { AssignDispatchRiderUseCase } from '../../application/use-cases/assign-dispatch-rider.use-case';
import { AutoAssignDispatchRiderUseCase } from '../../application/use-cases/auto-assign-dispatch-rider.use-case';
import { ReassignDispatchTaskUseCase } from '../../application/use-cases/reassign-dispatch-task.use-case';
import { CancelDispatchTaskUseCase } from '../../application/use-cases/cancel-dispatch-task.use-case';
import {
  AssignDispatchDto,
  AutoAssignDispatchDto,
} from '../../application/dtos/business-dispatch.dto';

@ApiTags('Business Dispatch Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.BusinessOwner, UserType.Staff)
@Controller('business/dispatch-tasks')
export class BusinessDispatchController {
  constructor(
    private readonly assignRider: AssignDispatchRiderUseCase,
    private readonly autoAssignRider: AutoAssignDispatchRiderUseCase,
    private readonly reassignTask: ReassignDispatchTaskUseCase,
    private readonly cancelTask: CancelDispatchTaskUseCase,
  ) {}

  @Post('auto-assign')
  @RequirePermissions('dispatch:manage')
  @ApiOperation({
    summary:
      'Automatically assign an available dispatch rider based on proximity',
  })
  async autoAssign(@Request() req: any, @Body() body: AutoAssignDispatchDto) {
    return this.autoAssignRider.execute(
      req.user.businessId,
      body.orderId,
      body.type,
    );
  }

  @Post('orders/:id/assign-pickup-rider')
  @RequirePermissions('orders:assign_dispatch')
  @ApiOperation({ summary: 'Assign a rider for pickup' })
  async assignPickup(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AssignDispatchDto,
  ) {
    return this.assignRider.execute(
      req.user.businessId,
      id,
      dto.riderId,
      DispatchTaskType.Pickup,
    );
  }

  @Post('orders/:id/assign-delivery-rider')
  @RequirePermissions('orders:assign_dispatch')
  @ApiOperation({ summary: 'Assign a rider for delivery' })
  async assignDelivery(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AssignDispatchDto,
  ) {
    return this.assignRider.execute(
      req.user.businessId,
      id,
      dto.riderId,
      DispatchTaskType.Delivery,
    );
  }

  @Post('dispatch-tasks/:id/reassign')
  @RequirePermissions('orders:assign_dispatch')
  @ApiOperation({ summary: 'Reassign an existing dispatch task' })
  async reassign(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AssignDispatchDto,
  ) {
    return this.reassignTask.execute(req.user.businessId, id, dto.riderId);
  }

  @Post('dispatch-tasks/:id/cancel')
  @RequirePermissions('orders:assign_dispatch')
  @ApiOperation({ summary: 'Cancel a dispatch task' })
  async cancel(@Request() req: any, @Param('id') id: string) {
    return this.cancelTask.execute(req.user.businessId, id);
  }
}
