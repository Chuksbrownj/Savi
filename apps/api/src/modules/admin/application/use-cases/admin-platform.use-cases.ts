import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IAdminRepository } from '../../infrastructure/repositories/prisma-admin.repository';

@Injectable()
export class AdminPlatformUseCases {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
  ) {}

  async getBusinesses(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    return this.adminRepository.getBusinesses(skip, limit, search);
  }

  async suspendBusiness(businessId: string) {
    try {
      return await this.adminRepository.updateBusinessStatus(businessId, false);
    } catch (e) {
      throw new NotFoundException('Business not found');
    }
  }

  async reactivateBusiness(businessId: string) {
    try {
      return await this.adminRepository.updateBusinessStatus(businessId, true);
    } catch (e) {
      throw new NotFoundException('Business not found');
    }
  }

  async getSystemAuditLogs(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return this.adminRepository.getSystemAuditLogs(skip, limit);
  }

  async getSystemHealth() {
    return this.adminRepository.getSystemHealthMetrics();
  }
}
