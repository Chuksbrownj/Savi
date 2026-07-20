import { Injectable } from '@nestjs/common';
import { LaundryService, Pricing, Branch } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  IBusinessServiceRepository,
  IBusinessBranchRepository,
} from '../../domain/repositories/business-service-pricing.repository.interface';

@Injectable()
export class PrismaBusinessServicePricingRepository
  implements IBusinessServiceRepository, IBusinessBranchRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async createService(
    data: Omit<LaundryService, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<LaundryService> {
    return this.prisma.laundryService.create({ data });
  }

  async findServices(businessId: string): Promise<LaundryService[]> {
    return this.prisma.laundryService.findMany({
      where: { businessId, deletedAt: null },
    });
  }

  async updateService(
    businessId: string,
    id: string,
    data: Partial<LaundryService>,
  ): Promise<LaundryService> {
    return this.prisma.laundryService.update({
      where: { id, businessId },
      data,
    });
  }

  async deleteService(businessId: string, id: string): Promise<void> {
    await this.prisma.laundryService.update({
      where: { id, businessId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async createPricing(
    data: Omit<Pricing, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Pricing> {
    return this.prisma.pricing.create({ data });
  }

  async findPricingByService(
    businessId: string,
    serviceId: string,
  ): Promise<Pricing[]> {
    return this.prisma.pricing.findMany({
      where: { businessId, laundryServiceId: serviceId, deletedAt: null },
    });
  }

  async updatePricing(
    businessId: string,
    id: string,
    data: Partial<Pricing>,
  ): Promise<Pricing> {
    return this.prisma.pricing.update({
      where: { id, businessId },
      data,
    });
  }

  async deletePricing(businessId: string, id: string): Promise<void> {
    await this.prisma.pricing.update({
      where: { id, businessId },
      data: { deletedAt: new Date() },
    });
  }

  async createBranch(
    data: Omit<Branch, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Branch> {
    return this.prisma.branch.create({ data: data as any });
  }

  async findBranches(businessId: string): Promise<Branch[]> {
    return this.prisma.branch.findMany({
      where: { businessId, deletedAt: null },
      include: { address: true },
    });
  }

  async updateBranch(
    businessId: string,
    id: string,
    data: Partial<Branch>,
  ): Promise<Branch> {
    return this.prisma.branch.update({
      where: { id, businessId },
      data: data as any,
    });
  }

  async deleteBranch(businessId: string, id: string): Promise<void> {
    await this.prisma.branch.update({
      where: { id, businessId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
