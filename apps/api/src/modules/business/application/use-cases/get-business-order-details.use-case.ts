import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IBusinessOrderRepository } from '../../domain/repositories/business-order.repository.interface';

@Injectable()
export class GetBusinessOrderDetailsUseCase {
  constructor(
    @Inject('IBusinessOrderRepository')
    private readonly orderRepository: IBusinessOrderRepository,
  ) {}

  async execute(businessId: string, orderId: string) {
    const order = await this.orderRepository.findById(businessId, orderId);
    if (!order) {
      throw new NotFoundException(
        'Order not found or does not belong to this business',
      );
    }
    return order;
  }
}
