import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CUSTOMER_PROFILE_REPOSITORY,
  ICustomerProfileRepository,
  CustomerProfileWithUser,
} from '../../domain/repositories/customer-profile.repository.interface';
import { UpdateCustomerProfileDto } from '../dtos/customer.dto';

@Injectable()
export class UpdateCustomerProfileUseCase {
  constructor(
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepo: ICustomerProfileRepository,
  ) {}

  async execute(
    userId: string,
    dto: UpdateCustomerProfileDto,
  ): Promise<CustomerProfileWithUser> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Customer profile not found');
    }

    const { name, email, phone } = dto;
    const userUpdateData: any = {};

    if (name) {
      userUpdateData.fullName = name;
    }

    if (email && email !== profile.user.email) {
      userUpdateData.email = email;
      userUpdateData.isEmailVerified = false;
    }

    if (phone && phone !== profile.user.phone) {
      userUpdateData.phone = phone;
      userUpdateData.isPhoneVerified = false;
    }

    if (Object.keys(userUpdateData).length > 0) {
      await this.profileRepo.updateUser(userId, userUpdateData);
    }

    return this.profileRepo.findByUserId(
      userId,
    ) as Promise<CustomerProfileWithUser>;
  }
}
