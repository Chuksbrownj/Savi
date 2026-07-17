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
  PROMOTION_REPOSITORY,
  IPromotionRepository,
} from '../../domain/repositories/promotion.repository.interface';
import { ApplyPromotionDto } from '../dtos/order.dto';
import { OrderStatus } from '@prisma/client';
import { OrderCalculatorService } from '../../domain/services/order-calculator.service';

@Injectable()
export class ApplyPromotionUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    @Inject(PROMOTION_REPOSITORY)
    private readonly promoRepo: IPromotionRepository,
    private readonly orderCalculator: OrderCalculatorService,
  ) {}

  async execute(orderId: string, customerId: string, dto: ApplyPromotionDto) {
    const order = await this.orderRepo.findById(orderId);
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.Draft) {
      throw new BadRequestException('Can only apply promotion to draft orders');
    }

    const promo = await this.promoRepo.findByCodeAndBusinessId(
      dto.code,
      order.businessId,
    );
    if (!promo || !promo.isActive) {
      throw new BadRequestException('Invalid or inactive promotion code');
    }

    const now = new Date();
    if (promo.startsAt > now || (promo.expiresAt && promo.expiresAt < now)) {
      throw new BadRequestException('Promotion is not active right now');
    }

    const result = this.orderCalculator.calculateDiscountFromTotal(
      order.subtotal,
      {
        discountType: promo.discountType,
        discountValue: promo.discountValue,
      },
    );

    return this.orderRepo.update(orderId, {
      discount: this.orderCalculator.toDecimal(result.discountCents) as any,
      total: this.orderCalculator.toDecimal(result.totalCents) as any,
    });
  }
}
