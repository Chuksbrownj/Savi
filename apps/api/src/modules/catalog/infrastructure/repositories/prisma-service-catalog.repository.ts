import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ServiceType } from '@prisma/client';
import {
  IServiceCatalogRepository,
  ServiceWithPricing,
} from '../../domain/repositories/service-catalog.repository.interface';

@Injectable()
export class PrismaServiceCatalogRepository
  implements IServiceCatalogRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findByBusinessId(
    businessId: string,
    params?: { serviceType?: ServiceType; isActive?: boolean },
  ): Promise<ServiceWithPricing[]> {
    const where: any = {
      businessId,
    };

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.serviceType) {
      where.serviceType = params.serviceType;
    }

    const results = await this.prisma.laundryService.findMany({
      where,
      include: { pricing: true },
    });

    return results as unknown as ServiceWithPricing[];
  }
}
