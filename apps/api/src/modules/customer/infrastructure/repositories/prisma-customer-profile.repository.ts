import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CustomerProfile, User } from '@prisma/client';
import {
  ICustomerProfileRepository,
  CustomerProfileWithUser,
} from '../../domain/repositories/customer-profile.repository.interface';

@Injectable()
export class PrismaCustomerProfileRepository
  implements ICustomerProfileRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<CustomerProfileWithUser | null> {
    return this.prisma.customerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updateProfile(
    id: string,
    data: Partial<CustomerProfile>,
  ): Promise<CustomerProfile> {
    return this.prisma.customerProfile.update({
      where: { id },
      data,
    });
  }
}
