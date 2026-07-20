import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IBusinessStaffRepository } from '../../domain/repositories/business-staff.repository.interface';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class ManageStaffUseCases {
  constructor(
    @Inject('IBusinessStaffRepository')
    private readonly repository: IBusinessStaffRepository,
    private readonly prisma: PrismaService,
  ) {}

  async inviteStaff(
    businessId: string,
    data: {
      userId: string;
      branchId: string;
      roleId: string;
      employeeCode?: string;
    },
  ) {
    // Basic checks
    const branch = await this.prisma.branch.findFirst({
      where: { id: data.branchId, businessId },
    });
    if (!branch)
      throw new BadRequestException(
        'Branch not found or belongs to another business',
      );

    // In a real app, this might send an invite email. For now, it just creates the profile.
    return this.repository.createStaffProfile({
      businessId,
      userId: data.userId,
      branchId: data.branchId,
      roleId: data.roleId,
      employeeCode: data.employeeCode ?? null,
      isActive: true,
    });
  }

  async findStaff(businessId: string) {
    return this.repository.findStaff(businessId);
  }

  async updateStaffRole(businessId: string, id: string, roleId: string) {
    return this.repository.updateStaff(businessId, id, { roleId });
  }

  async removeStaff(businessId: string, id: string) {
    return this.repository.deleteStaff(businessId, id);
  }

  async registerRider(
    businessId: string,
    data: { userId: string; vehicleId?: string },
  ) {
    return this.repository.createRiderProfile({
      businessId,
      userId: data.userId,
      vehicleId: data.vehicleId ?? null,
    });
  }

  async findRiders(businessId: string) {
    return this.repository.findRiders(businessId);
  }
}
