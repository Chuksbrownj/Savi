import { LaundryService, Pricing, ServiceType } from '@prisma/client';

export type ServiceWithPricing = LaundryService & { pricing: Pricing | null };

export const SERVICE_CATALOG_REPOSITORY = Symbol('SERVICE_CATALOG_REPOSITORY');

export interface IServiceCatalogRepository {
  findByBusinessId(
    businessId: string,
    params?: { serviceType?: ServiceType; isActive?: boolean },
  ): Promise<ServiceWithPricing[]>;
}
