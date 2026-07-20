import { Inject, Injectable } from '@nestjs/common';
import { IBusinessPromotionRepository } from '../../domain/repositories/business-promo-settle.repository.interface';

@Injectable()
export class ManagePromotionsUseCases {
  constructor(
    @Inject('IBusinessPromotionRepository')
    private readonly repository: IBusinessPromotionRepository,
  ) {}

  async createPromotion(businessId: string, data: any) {
    return this.repository.createPromotion({
      businessId,
      code: data.code,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      startsAt: new Date(data.startsAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      usageLimit: data.usageLimit,
      timesUsed: 0,
      isActive: data.isActive ?? true,
    });
  }

  async findPromotions(businessId: string) {
    return this.repository.findPromotions(businessId);
  }

  async updatePromotion(businessId: string, id: string, data: any) {
    return this.repository.updatePromotion(businessId, id, data);
  }

  async deletePromotion(businessId: string, id: string) {
    return this.repository.deletePromotion(businessId, id);
  }
}
