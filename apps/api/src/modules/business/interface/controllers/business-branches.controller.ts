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

import { ManageBranchesUseCases } from '../../application/use-cases/manage-branches.use-cases';

@ApiTags('Business Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.BusinessOwner, UserType.Staff)
@Controller('business/branches')
export class BusinessBranchesController {
  constructor(private readonly branches: ManageBranchesUseCases) {}

  @Post()
  @RequirePermissions('branches:manage')
  @ApiOperation({ summary: 'Create a new branch' })
  async createBranch(@Request() req: any, @Body() body: any) {
    return this.branches.createBranch(req.user.businessId, body);
  }

  @Get()
  @RequirePermissions('branches:read')
  @ApiOperation({ summary: 'List all branches' })
  async getBranches(@Request() req: any) {
    return this.branches.findBranches(req.user.businessId);
  }

  @Patch(':id')
  @RequirePermissions('branches:manage')
  @ApiOperation({ summary: 'Update a branch' })
  async updateBranch(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.branches.updateBranch(req.user.businessId, id, body);
  }

  @Delete(':id')
  @RequirePermissions('branches:manage')
  @ApiOperation({ summary: 'Delete a branch (soft delete)' })
  async deleteBranch(@Request() req: any, @Param('id') id: string) {
    return this.branches.deleteBranch(req.user.businessId, id);
  }
}
