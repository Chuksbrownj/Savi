import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Business } from '@prisma/client';
import { IBusinessCatalogRepository } from '../../domain/repositories/business-catalog.repository.interface';

@Injectable()
export class PrismaBusinessCatalogRepository
  implements IBusinessCatalogRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(params?: {
    city?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Business[]> {
    const { city, search, limit = 50, offset = 0 } = params || {};

    const where: any = {
      isActive: true,
      // You can expand this to check onboarding status etc.
    };

    if (city) {
      where.addressCity = { contains: city, mode: 'insensitive' };
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    return this.prisma.business.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Business | null> {
    return this.prisma.business.findFirst({
      where: { id, isActive: true },
    });
  }
}
