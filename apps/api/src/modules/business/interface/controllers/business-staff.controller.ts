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

import { ManageStaffUseCases } from '../../application/use-cases/manage-staff.use-cases';

@ApiTags('Business Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.BusinessOwner, UserType.Staff)
@Controller('business')
export class BusinessStaffController {
  constructor(private readonly staff: ManageStaffUseCases) {}

  @Post('staff')
  @RequirePermissions('staff:manage')
  @ApiOperation({ summary: 'Invite or create staff profile' })
  async inviteStaff(@Request() req: any, @Body() body: any) {
    return this.staff.inviteStaff(req.user.businessId, body);
  }

  @Get('staff')
  @RequirePermissions('staff:read')
  @ApiOperation({ summary: 'List all staff' })
  async getStaff(@Request() req: any) {
    return this.staff.findStaff(req.user.businessId);
  }

  @Patch('staff/:id/role')
  @RequirePermissions('staff:manage')
  @ApiOperation({ summary: 'Update staff role' })
  async updateStaffRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body('roleId') roleId: string,
  ) {
    return this.staff.updateStaffRole(req.user.businessId, id, roleId);
  }

  @Delete('staff/:id')
  @RequirePermissions('staff:manage')
  @ApiOperation({ summary: 'Remove staff member' })
  async removeStaff(@Request() req: any, @Param('id') id: string) {
    return this.staff.removeStaff(req.user.businessId, id);
  }

  @Post('riders')
  @RequirePermissions('staff:manage')
  @ApiOperation({ summary: 'Register a dispatch rider for this business' })
  async registerRider(@Request() req: any, @Body() body: any) {
    return this.staff.registerRider(req.user.businessId, body);
  }

  @Get('riders')
  @RequirePermissions('staff:read')
  @ApiOperation({ summary: 'List all dispatch riders' })
  async getRiders(@Request() req: any) {
    return this.staff.findRiders(req.user.businessId);
  }
}
