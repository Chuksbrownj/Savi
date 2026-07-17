import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SERVICE_CATALOG_REPOSITORY,
  IServiceCatalogRepository,
  ServiceWithPricing,
} from '../../domain/repositories/service-catalog.repository.interface';
import {
  BUSINESS_CATALOG_REPOSITORY,
  IBusinessCatalogRepository,
} from '../../domain/repositories/business-catalog.repository.interface';
import { ServiceType } from '@prisma/client';

@Injectable()
export class ListBusinessServicesUseCase {
  constructor(
    @Inject(SERVICE_CATALOG_REPOSITORY)
    private readonly serviceRepo: IServiceCatalogRepository,
    @Inject(BUSINESS_CATALOG_REPOSITORY)
    private readonly businessRepo: IBusinessCatalogRepository,
  ) {}

  async execute(
    businessId: string,
    params?: { serviceType?: ServiceType },
  ): Promise<ServiceWithPricing[]> {
    const business = await this.businessRepo.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found or inactive');
    }

    return this.serviceRepo.findByBusinessId(businessId, {
      isActive: true,
      serviceType: params?.serviceType,
    });
  }
}
