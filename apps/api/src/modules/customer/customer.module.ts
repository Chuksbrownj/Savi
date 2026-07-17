import { Module } from '@nestjs/common';
import { CustomerController } from './interface/controllers/customer.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { CUSTOMER_PROFILE_REPOSITORY } from './domain/repositories/customer-profile.repository.interface';
import { PrismaCustomerProfileRepository } from './infrastructure/repositories/prisma-customer-profile.repository';

import { ADDRESS_REPOSITORY } from './domain/repositories/address.repository.interface';
import { PrismaAddressRepository } from './infrastructure/repositories/prisma-address.repository';

import { SUPPORT_TICKET_REPOSITORY } from './domain/repositories/support-ticket.repository.interface';
import { PrismaSupportTicketRepository } from './infrastructure/repositories/prisma-support-ticket.repository';

import { GEOCODING_SERVICE } from './infrastructure/geocoding/geocoding.interface';
import { StubGeocodingService } from './infrastructure/geocoding/stub-geocoding.service';

import { GetCustomerProfileUseCase } from './application/use-cases/get-customer-profile.use-case';
import { UpdateCustomerProfileUseCase } from './application/use-cases/update-customer-profile.use-case';
import { CreateAddressUseCase } from './application/use-cases/create-address.use-case';
import { UpdateAddressUseCase } from './application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from './application/use-cases/delete-address.use-case';
import { GetCustomerAddressesUseCase } from './application/use-cases/get-customer-addresses.use-case';
import { CreateSupportTicketUseCase } from './application/use-cases/create-support-ticket.use-case';
import { GetCustomerSupportTicketsUseCase } from './application/use-cases/get-customer-support-tickets.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerController],
  providers: [
    {
      provide: CUSTOMER_PROFILE_REPOSITORY,
      useClass: PrismaCustomerProfileRepository,
    },
    {
      provide: ADDRESS_REPOSITORY,
      useClass: PrismaAddressRepository,
    },
    {
      provide: SUPPORT_TICKET_REPOSITORY,
      useClass: PrismaSupportTicketRepository,
    },
    {
      provide: GEOCODING_SERVICE,
      useClass: StubGeocodingService,
    },
    GetCustomerProfileUseCase,
    UpdateCustomerProfileUseCase,
    CreateAddressUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
    GetCustomerAddressesUseCase,
    CreateSupportTicketUseCase,
    GetCustomerSupportTicketsUseCase,
  ],
  exports: [CUSTOMER_PROFILE_REPOSITORY, ADDRESS_REPOSITORY],
})
export class CustomerModule {}
