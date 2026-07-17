import { Promotion } from '@prisma/client';

export const PROMOTION_REPOSITORY = Symbol('PROMOTION_REPOSITORY');

export interface IPromotionRepository {
  findByCodeAndBusinessId(
    code: string,
    businessId: string,
  ): Promise<Promotion | null>;
}
