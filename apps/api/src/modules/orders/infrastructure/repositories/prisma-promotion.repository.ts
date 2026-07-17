import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Promotion } from '@prisma/client';
import { IPromotionRepository } from '../../domain/repositories/promotion.repository.interface';

@Injectable()
export class PrismaPromotionRepository implements IPromotionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCodeAndBusinessId(
    code: string,
    businessId: string,
  ): Promise<Promotion | null> {
    return this.prisma.promotion.findFirst({
      where: { code, businessId, isActive: true },
    });
  }
}
