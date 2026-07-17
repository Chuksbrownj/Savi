import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ADDRESS_REPOSITORY,
  IAddressRepository,
} from '../../domain/repositories/address.repository.interface';

@Injectable()
export class DeleteAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: IAddressRepository,
  ) {}

  async execute(userId: string, addressId: string): Promise<void> {
    const address = await this.addressRepo.findByIdAndUserId(addressId, userId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.addressRepo.delete(addressId, userId);
  }
}
