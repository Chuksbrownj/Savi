import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ADDRESS_REPOSITORY,
  IAddressRepository,
} from '../../domain/repositories/address.repository.interface';
import { UpdateAddressDto } from '../dtos/customer.dto';
import { Address } from '@prisma/client';

@Injectable()
export class UpdateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: IAddressRepository,
  ) {}

  async execute(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.addressRepo.findByIdAndUserId(addressId, userId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault) {
      await this.addressRepo.clearDefaultAddress(userId);
    }

    return this.addressRepo.update(addressId, userId, dto);
  }
}
