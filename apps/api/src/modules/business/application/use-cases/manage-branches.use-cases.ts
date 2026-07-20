import { Inject, Injectable } from '@nestjs/common';
import { IBusinessBranchRepository } from '../../domain/repositories/business-service-pricing.repository.interface';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class ManageBranchesUseCases {
  constructor(
    @Inject('IBusinessBranchRepository')
    private readonly repository: IBusinessBranchRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createBranch(
    businessId: string,
    data: {
      name: string;
      phone?: string;
      operatingHours?: any;
      address: any;
      isActive?: boolean;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: data.address,
      });

      return tx.branch.create({
        data: {
          businessId,
          name: data.name,
          phone: data.phone,
          operatingHours: data.operatingHours,
          isActive: data.isActive ?? true,
          addressId: address.id,
        },
        include: { address: true },
      });
    });
  }

  async findBranches(businessId: string) {
    return this.repository.findBranches(businessId);
  }

  async updateBranch(businessId: string, id: string, data: any) {
    return this.repository.updateBranch(businessId, id, data);
  }

  async deleteBranch(businessId: string, id: string) {
    return this.repository.deleteBranch(businessId, id);
  }
}
