import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
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

import { GetCustomerProfileUseCase } from '../../application/use-cases/get-customer-profile.use-case';
import { UpdateCustomerProfileUseCase } from '../../application/use-cases/update-customer-profile.use-case';
import { CreateAddressUseCase } from '../../application/use-cases/create-address.use-case';
import { UpdateAddressUseCase } from '../../application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from '../../application/use-cases/delete-address.use-case';
import { GetCustomerAddressesUseCase } from '../../application/use-cases/get-customer-addresses.use-case';
import { CreateSupportTicketUseCase } from '../../application/use-cases/create-support-ticket.use-case';
import { GetCustomerSupportTicketsUseCase } from '../../application/use-cases/get-customer-support-tickets.use-case';

import {
  UpdateCustomerProfileDto,
  CreateAddressDto,
  UpdateAddressDto,
} from '../../application/dtos/customer.dto';
import { CreateSupportTicketDto } from '../../application/dtos/support-ticket.dto';

@ApiTags('Customer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.Customer)
@Controller('api/v1/customer')
export class CustomerController {
  constructor(
    private readonly getProfile: GetCustomerProfileUseCase,
    private readonly updateProfile: UpdateCustomerProfileUseCase,
    private readonly createAddress: CreateAddressUseCase,
    private readonly updateAddress: UpdateAddressUseCase,
    private readonly deleteAddress: DeleteAddressUseCase,
    private readonly getAddresses: GetCustomerAddressesUseCase,
    private readonly createTicket: CreateSupportTicketUseCase,
    private readonly getTickets: GetCustomerSupportTicketsUseCase,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get customer profile' })
  async getProfileInfo(@Request() req: any) {
    return this.getProfile.execute(req.user.userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update customer profile' })
  async updateProfileInfo(
    @Request() req: any,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    return this.updateProfile.execute(req.user.userId, dto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Get customer addresses' })
  async listAddresses(@Request() req: any) {
    return this.getAddresses.execute(req.user.userId);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create new address' })
  async addAddress(@Request() req: any, @Body() dto: CreateAddressDto) {
    return this.createAddress.execute(req.user.userId, dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update an address' })
  async editAddress(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.updateAddress.execute(req.user.userId, id, dto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete an address' })
  async removeAddress(@Request() req: any, @Param('id') id: string) {
    return this.deleteAddress.execute(req.user.userId, id);
  }

  @Get('support-tickets')
  @ApiOperation({ summary: 'Get support tickets' })
  async listTickets(@Request() req: any) {
    return this.getTickets.execute(req.user.userId);
  }

  @Post('support-tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  async addTicket(@Request() req: any, @Body() dto: CreateSupportTicketDto) {
    return this.createTicket.execute(req.user.userId, dto);
  }
}
