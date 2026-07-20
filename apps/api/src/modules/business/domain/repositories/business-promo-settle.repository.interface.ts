import { Promotion, Settlement } from '@prisma/client';

export interface IBusinessPromotionRepository {
  createPromotion(
    data: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Promotion>;
  findPromotions(businessId: string): Promise<Promotion[]>;
  updatePromotion(
    businessId: string,
    id: string,
    data: Partial<Promotion>,
  ): Promise<Promotion>;
  deletePromotion(businessId: string, id: string): Promise<void>;
}

export interface IBusinessSettlementRepository {
  createSettlement(
    data: Omit<Settlement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Settlement>;
  findSettlements(businessId: string, filters: any): Promise<Settlement[]>;
}
