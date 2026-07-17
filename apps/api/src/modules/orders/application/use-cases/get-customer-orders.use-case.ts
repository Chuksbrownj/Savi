import { Inject, Injectable } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  IOrderRepository,
} from '../../domain/repositories/order.repository.interface';

@Injectable()
export class GetCustomerOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
  ) {}

  async execute(customerId: string) {
    return this.orderRepo.findByCustomerId(customerId);
  }
}
