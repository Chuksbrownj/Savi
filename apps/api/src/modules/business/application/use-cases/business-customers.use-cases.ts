import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class BusinessCustomersUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(businessId: string) {
    // Find customers who have at least one order with this business
    return this.prisma.customerProfile.findMany({
      where: {
        orders: {
          some: { businessId },
        },
      },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
      },
    });
  }

  async getCustomerDetails(businessId: string, customerId: string) {
    // Find customer and their orders with this specific business
    const customer = await this.prisma.customerProfile.findFirst({
      where: {
        id: customerId,
        orders: { some: { businessId } },
      },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        orders: {
          where: { businessId },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found or has no orders with this business',
      );
    }

    return customer;
  }
}
