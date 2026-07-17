import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  IOrderRepository,
} from '../../domain/repositories/order.repository.interface';
import {
  RATING_REPOSITORY,
  IRatingRepository,
} from '../../domain/repositories/rating.repository.interface';
import { RateOrderDto } from '../dtos/order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class RateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    @Inject(RATING_REPOSITORY)
    private readonly ratingRepo: IRatingRepository,
  ) {}

  async execute(orderId: string, customerId: string, dto: RateOrderDto) {
    const order = await this.orderRepo.findById(orderId);
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.Completed) {
      throw new BadRequestException('Can only rate completed orders');
    }

    const existingRating = await this.ratingRepo.findByOrderId(orderId);
    if (existingRating) {
      throw new BadRequestException('Order has already been rated');
    }

    return this.ratingRepo.create({
      orderId,
      customerId,
      businessId: order.businessId,
      riderId: null,
      score: dto.rating,
      comment: dto.review || null,
    });
  }
}
