import { Injectable } from '@nestjs/common';
import { StaffProfile, DispatchRiderProfile } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IBusinessStaffRepository } from '../../domain/repositories/business-staff.repository.interface';

@Injectable()
export class PrismaBusinessStaffRepository implements IBusinessStaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createStaffProfile(
    data: Omit<StaffProfile, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<StaffProfile> {
    return this.prisma.staffProfile.create({ data });
  }

  async findStaff(businessId: string): Promise<StaffProfile[]> {
    return this.prisma.staffProfile.findMany({
      where: { businessId },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        role: true,
        branch: true,
      },
    });
  }

  async updateStaff(
    businessId: string,
    id: string,
    data: Partial<StaffProfile>,
  ): Promise<StaffProfile> {
    return this.prisma.staffProfile.update({
      where: { id, businessId },
      data,
    });
  }

  async deleteStaff(businessId: string, id: string): Promise<void> {
    await this.prisma.staffProfile.update({
      where: { id, businessId },
      data: { isActive: false },
    });
  }

  async createRiderProfile(
    data: Omit<
      DispatchRiderProfile,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'availability'
      | 'currentLat'
      | 'currentLng'
      | 'rating'
      | 'totalDeliveries'
      | 'isActive'
    >,
  ): Promise<DispatchRiderProfile> {
    return this.prisma.dispatchRiderProfile.create({ data });
  }

  async findRiders(businessId: string): Promise<DispatchRiderProfile[]> {
    return this.prisma.dispatchRiderProfile.findMany({
      where: { businessId },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
      },
    });
  }

  async updateRider(
    businessId: string,
    id: string,
    data: Partial<DispatchRiderProfile>,
  ): Promise<DispatchRiderProfile> {
    return this.prisma.dispatchRiderProfile.update({
      where: { id, businessId },
      data,
    });
  }
}
