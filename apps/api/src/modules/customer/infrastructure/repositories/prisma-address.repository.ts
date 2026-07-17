import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Address } from '@prisma/client';
import { IAddressRepository } from '../../domain/repositories/address.repository.interface';

@Injectable()
export class PrismaAddressRepository implements IAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Address> {
    return this.prisma.address.create({ data });
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Address>,
  ): Promise<Address> {
    await this.prisma.address.updateMany({
      where: { id, userId },
      data,
    });
    return this.prisma.address.findFirstOrThrow({ where: { id } });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.address.deleteMany({
      where: { id, userId },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Address | null> {
    return this.prisma.address.findFirst({
      where: { id, userId },
    });
  }

  async findByUserId(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async clearDefaultAddress(userId: string): Promise<void> {
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    // Requires a transaction: clear all, then set the specific one
    await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.address.updateMany({
        where: { id: addressId, userId },
        data: { isDefault: true },
      }),
    ]);
  }
}
