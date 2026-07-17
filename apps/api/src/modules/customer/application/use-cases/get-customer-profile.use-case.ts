import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  CUSTOMER_PROFILE_REPOSITORY,
  ICustomerProfileRepository,
} from '../../domain/repositories/customer-profile.repository.interface';

@Injectable()
export class GetCustomerProfileUseCase {
  constructor(
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepo: ICustomerProfileRepository,
  ) {}

  async execute(userId: string) {
    const customer = await this.profileRepo.findByUserId(userId);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return customer;
  }
}
