import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IBusinessServiceRepository } from '../../domain/repositories/business-service-pricing.repository.interface';

@Injectable()
export class ManageServicesPricingUseCases {
  constructor(
    @Inject('IBusinessServiceRepository')
    private readonly repository: IBusinessServiceRepository,
  ) {}

  async createService(
    businessId: string,
    data: { name: string; description?: string; isActive?: boolean },
  ) {
    return this.repository.createService({
      businessId,
      ...data,
      description: data.description ?? null,
      isActive: data.isActive ?? true,
    });
  }

  async findServices(businessId: string) {
    return this.repository.findServices(businessId);
  }

  async updateService(businessId: string, id: string, data: any) {
    return this.repository.updateService(businessId, id, data);
  }

  async deleteService(businessId: string, id: string) {
    return this.repository.deleteService(businessId, id);
  }

  async createPricing(
    businessId: string,
    data: {
      laundryServiceId: string;
      unit: string;
      basePrice: any;
      expressSurchargePercent?: any;
      currency?: string;
    },
  ) {
    return this.repository.createPricing({
      businessId,
      laundryServiceId: data.laundryServiceId,
      unit: data.unit,
      basePrice: data.basePrice,
      expressSurchargePercent: data.expressSurchargePercent ?? 0,
      currency: data.currency || 'NGN',
    });
  }

  async findPricingByService(businessId: string, serviceId: string) {
    return this.repository.findPricingByService(businessId, serviceId);
  }

  async updatePricing(businessId: string, id: string, data: any) {
    return this.repository.updatePricing(businessId, id, data);
  }

  async deletePricing(businessId: string, id: string) {
    return this.repository.deletePricing(businessId, id);
  }
}
