import { Inject, Injectable } from '@nestjs/common';
import {
  ADDRESS_REPOSITORY,
  IAddressRepository,
} from '../../domain/repositories/address.repository.interface';
import { Address } from '@prisma/client';

@Injectable()
export class GetCustomerAddressesUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: IAddressRepository,
  ) {}

  async execute(userId: string): Promise<Address[]> {
    return this.addressRepo.findByUserId(userId);
  }
}
