import { Rating } from '@prisma/client';

export const RATING_REPOSITORY = Symbol('RATING_REPOSITORY');

export interface IRatingRepository {
  create(data: Omit<Rating, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rating>;
  findByOrderId(orderId: string): Promise<Rating | null>;
}
