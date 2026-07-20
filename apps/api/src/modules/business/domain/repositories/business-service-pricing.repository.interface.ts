import { LaundryService, Pricing, Branch } from '@prisma/client';

export interface IBusinessServiceRepository {
  createService(
    data: Omit<LaundryService, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<LaundryService>;
  findServices(businessId: string): Promise<LaundryService[]>;
  updateService(
    businessId: string,
    id: string,
    data: Partial<LaundryService>,
  ): Promise<LaundryService>;
  deleteService(businessId: string, id: string): Promise<void>;

  createPricing(
    data: Omit<Pricing, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Pricing>;
  findPricingByService(
    businessId: string,
    serviceId: string,
  ): Promise<Pricing[]>;
  updatePricing(
    businessId: string,
    id: string,
    data: Partial<Pricing>,
  ): Promise<Pricing>;
  deletePricing(businessId: string, id: string): Promise<void>;
}

export interface IBusinessBranchRepository {
  createBranch(
    data: Omit<Branch, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Branch>;
  findBranches(businessId: string): Promise<Branch[]>;
  updateBranch(
    businessId: string,
    id: string,
    data: Partial<Branch>,
  ): Promise<Branch>;
  deleteBranch(businessId: string, id: string): Promise<void>;
}
