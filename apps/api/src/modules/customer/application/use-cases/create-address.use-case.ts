import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import {
  ADDRESS_REPOSITORY,
  IAddressRepository,
} from '../../domain/repositories/address.repository.interface';
import { CreateAddressDto } from '../dtos/customer.dto';
import {
  GEOCODING_SERVICE,
  IGeocodingService,
} from '../../infrastructure/geocoding/geocoding.interface';
import { Address } from '@prisma/client';

@Injectable()
export class CreateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: IAddressRepository,
    @Inject(GEOCODING_SERVICE)
    private readonly geocodingService: IGeocodingService,
  ) {}

  async execute(userId: string, dto: CreateAddressDto): Promise<Address> {
    const fullAddressString = `${dto.line1}, ${dto.city}, ${dto.state}, ${dto.country}`;

    let lat = dto.lat;
    let lng = dto.lng;

    if (!lat || !lng) {
      const coords =
        await this.geocodingService.getCoordinates(fullAddressString);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    // Default `isDefault` logic: If no addresses exist, it should be true.
    const existingAddresses = await this.addressRepo.findByUserId(userId);
    const shouldBeDefault =
      existingAddresses.length === 0 ? true : !!dto.isDefault;

    if (shouldBeDefault && existingAddresses.length > 0) {
      await this.addressRepo.clearDefaultAddress(userId);
    }

    const newAddress = await this.addressRepo.create({
      userId,
      label: dto.label || null,
      line1: dto.line1,
      line2: dto.line2 || null,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      lat: lat || null,
      lng: lng || null,
      isDefault: shouldBeDefault,
    });

    return newAddress;
  }
}
