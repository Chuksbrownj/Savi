import { Address } from '@prisma/client';

export const ADDRESS_REPOSITORY = Symbol('ADDRESS_REPOSITORY');

export interface IAddressRepository {
  create(
    data: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Address>;
  update(id: string, userId: string, data: Partial<Address>): Promise<Address>;
  delete(id: string, userId: string): Promise<void>;
  findByIdAndUserId(id: string, userId: string): Promise<Address | null>;
  findByUserId(userId: string): Promise<Address[]>;
  clearDefaultAddress(userId: string): Promise<void>;
  setDefaultAddress(userId: string, addressId: string): Promise<void>;
}
