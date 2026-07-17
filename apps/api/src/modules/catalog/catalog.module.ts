import { Module } from '@nestjs/common';
import { CatalogController } from './interface/controllers/catalog.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { BUSINESS_CATALOG_REPOSITORY } from './domain/repositories/business-catalog.repository.interface';
import { PrismaBusinessCatalogRepository } from './infrastructure/repositories/prisma-business-catalog.repository';

import { SERVICE_CATALOG_REPOSITORY } from './domain/repositories/service-catalog.repository.interface';
import { PrismaServiceCatalogRepository } from './infrastructure/repositories/prisma-service-catalog.repository';

import { ListBusinessesUseCase } from './application/use-cases/list-businesses.use-case';
import { ListBusinessServicesUseCase } from './application/use-cases/list-business-services.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [CatalogController],
  providers: [
    {
      provide: BUSINESS_CATALOG_REPOSITORY,
      useClass: PrismaBusinessCatalogRepository,
    },
    {
      provide: SERVICE_CATALOG_REPOSITORY,
      useClass: PrismaServiceCatalogRepository,
    },
    ListBusinessesUseCase,
    ListBusinessServicesUseCase,
  ],
  exports: [BUSINESS_CATALOG_REPOSITORY, SERVICE_CATALOG_REPOSITORY],
})
export class CatalogModule {}
