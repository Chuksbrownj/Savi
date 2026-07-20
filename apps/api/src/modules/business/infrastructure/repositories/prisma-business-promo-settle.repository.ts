import { Injectable } from '@nestjs/common';
import { Promotion, Settlement } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  IBusinessPromotionRepository,
  IBusinessSettlementRepository,
} from '../../domain/repositories/business-promo-settle.repository.interface';

@Injectable()
export class PrismaBusinessPromoSettleRepository
  implements IBusinessPromotionRepository, IBusinessSettlementRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async createPromotion(
    data: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Promotion> {
    return this.prisma.promotion.create({ data });
  }

  async findPromotions(businessId: string): Promise<Promotion[]> {
    return this.prisma.promotion.findMany({
      where: { businessId, deletedAt: null },
    });
  }

  async updatePromotion(
    businessId: string,
    id: string,
    data: Partial<Promotion>,
  ): Promise<Promotion> {
    return this.prisma.promotion.update({
      where: { id, businessId },
      data,
    });
  }

  async deletePromotion(businessId: string, id: string): Promise<void> {
    await this.prisma.promotion.update({
      where: { id, businessId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async createSettlement(
    data: Omit<Settlement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Settlement> {
    return this.prisma.settlement.create({ data });
  }

  async findSettlements(
    businessId: string,
    filters: any,
  ): Promise<Settlement[]> {
    return this.prisma.settlement.findMany({
      where: { businessId, ...filters },
      orderBy: { createdAt: 'desc' },
    });
  }
}
