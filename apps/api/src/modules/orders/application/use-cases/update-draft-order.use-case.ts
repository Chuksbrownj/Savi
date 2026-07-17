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
import { CreateOrderDto } from '../dtos/order.dto';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  OrderCalculatorService,
  OrderItemCalcInfo,
} from '../../domain/services/order-calculator.service';

@Injectable()
export class UpdateDraftOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    private readonly prisma: PrismaService,
    private readonly orderCalculator: OrderCalculatorService,
  ) {}

  async execute(orderId: string, customerId: string, dto: CreateOrderDto) {
    const order = await this.orderRepo.findById(orderId);
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.Draft) {
      throw new BadRequestException('Only draft orders can be updated');
    }

    const itemsData = [];
    const calcItems: OrderItemCalcInfo[] = [];
    let expressSurchargePercent = 0;

    for (const itemDto of dto.items) {
      if (itemDto.quantity <= 0) {
        throw new BadRequestException(
          `Quantity for service ${itemDto.serviceId} must be > 0`,
        );
      }

      const service = await this.prisma.laundryService.findUnique({
        where: { id: itemDto.serviceId },
        include: { pricing: true },
      });

      if (
        !service ||
        service.businessId !== order.businessId ||
        !service.isActive
      ) {
        throw new BadRequestException(
          `Service ${itemDto.serviceId} is invalid or unavailable`,
        );
      }

      if (!service.pricing || service.pricing.length === 0) {
        throw new BadRequestException(
          `Service ${service.name} has no pricing set`,
        );
      }

      const pricing = service.pricing[0];
      const unitPrice = pricing.basePrice; // Decimal from Prisma

      if (dto.isExpress && pricing.expressSurchargePercent) {
        expressSurchargePercent = Math.max(
          expressSurchargePercent,
          Number(pricing.expressSurchargePercent),
        );
      }

      calcItems.push({
        quantity: itemDto.quantity,
        unitPrice,
      });

      const lineSubtotalCents =
        this.orderCalculator.toCents(unitPrice) * itemDto.quantity;

      itemsData.push({
        serviceId: service.id, // Maps to laundryServiceId in Prisma
        quantity: itemDto.quantity,
        unitPrice: this.orderCalculator.toDecimal(
          this.orderCalculator.toCents(unitPrice),
        ),
        lineTotal: this.orderCalculator.toDecimal(lineSubtotalCents),
        unit: pricing.unit,
      });
    }

    const calcResult = this.orderCalculator.calculateOrderTotals(
      calcItems,
      dto.isExpress || false,
      expressSurchargePercent,
      null, // Currently no promotion preserved on update, would require re-fetching
      0, // No delivery fee by default
    );

    // Update order level fields
    await this.orderRepo.update(orderId, {
      pickupAddressId: dto.pickupAddressId,
      deliveryAddressId: dto.deliveryAddressId,
      notes: dto.specialInstructions || null,
      subtotal: this.orderCalculator.toDecimal(calcResult.subtotalCents) as any,
      discount: this.orderCalculator.toDecimal(calcResult.discountCents) as any,
      total: this.orderCalculator.toDecimal(calcResult.totalCents) as any,
      isExpress: dto.isExpress || false,
    });

    // Update items
    return this.orderRepo.updateItems(
      orderId,
      itemsData.map((item) => ({
        laundryServiceId: item.serviceId,
        quantity: item.quantity,
        unitPrice: item.unitPrice as any,
        lineTotal: item.lineTotal as any,
        unit: item.unit,
      })),
    );
  }
}
