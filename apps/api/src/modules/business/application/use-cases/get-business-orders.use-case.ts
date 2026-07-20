import { Inject, Injectable } from '@nestjs/common';
import { IBusinessOrderRepository } from '../../domain/repositories/business-order.repository.interface';

@Injectable()
export class GetBusinessOrdersUseCase {
  constructor(
    @Inject('IBusinessOrderRepository')
    private readonly orderRepository: IBusinessOrderRepository,
  ) {}

  async execute(
    businessId: string,
    params: {
      page?: number;
      limit?: number;
      status?: any;
      branchId?: string;
      customerId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const startDate = params.startDate ? new Date(params.startDate) : undefined;
    const endDate = params.endDate ? new Date(params.endDate) : undefined;

    return this.orderRepository.findOrders(businessId, {
      skip,
      take: limit,
      status: params.status,
      branchId: params.branchId,
      customerId: params.customerId,
      startDate,
      endDate,
    });
  }
}
