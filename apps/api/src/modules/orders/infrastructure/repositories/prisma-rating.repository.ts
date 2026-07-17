import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Rating } from '@prisma/client';
import { IRatingRepository } from '../../domain/repositories/rating.repository.interface';

@Injectable()
export class PrismaRatingRepository implements IRatingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<Rating, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Rating> {
    return this.prisma.rating.create({ data });
  }

  async findByOrderId(orderId: string): Promise<Rating | null> {
    return this.prisma.rating.findUnique({
      where: { orderId },
    });
  }
}
