import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  IOrderRepository,
} from '../../domain/repositories/order.repository.interface';
import { CreateOrderDto } from '../dtos/order.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  OrderCalculatorService,
  OrderItemCalcInfo,
} from '../../domain/services/order-calculator.service';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    private readonly prisma: PrismaService,
    private readonly orderCalculator: OrderCalculatorService,
  ) {}

  async execute(customerId: string, dto: CreateOrderDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
    });

    if (!business || !business.isActive) {
      throw new NotFoundException('Business not found or inactive');
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });

    if (!branch || !branch.isActive) {
      throw new BadRequestException('Branch not found or inactive');
    }

    // Operating hours validation (assuming basic JSON structure)
    if (branch.operatingHours) {
      const scheduledDate = new Date(dto.scheduledPickupAt);
      const dayOfWeek = scheduledDate.toLocaleString('en-US', {
        weekday: 'long',
      });
      const hours = (branch.operatingHours as any)[dayOfWeek];

      if (!hours || hours.closed) {
        throw new BadRequestException(`Branch is closed on ${dayOfWeek}`);
      }

      // Optional: Check specific times if hours.open and hours.close exist
    }

    // Geocoding and Radius Stub (Phase 4 requirement)
    // const branchCoords = await this.geocodingService.getCoordinates(branch.address);
    // const pickupCoords = await this.geocodingService.getCoordinates(dto.pickupAddressId);
    // if (calculateDistance(branchCoords, pickupCoords) > business.serviceRadius) {
    //   throw new UnprocessableEntityException('Address falls outside the business service radius');
    // }

    // Validate items and gather pricing info
    const itemsData = [];
    const calcItems: OrderItemCalcInfo[] = [];

    // Pre-calculate an assumed delivery fee (if any, set to 0 for now)
    const deliveryFee = 0;
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
        service.businessId !== dto.businessId ||
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

      // Assume the highest express surcharge percent across items if multiple apply, or handle logic per business
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

      // We'll calculate the lineTotal individually for database storage
      const lineSubtotalCents =
        this.orderCalculator.toCents(unitPrice) * itemDto.quantity;

      itemsData.push({
        serviceId: service.id,
        quantity: itemDto.quantity,
        unitPrice: this.orderCalculator.toDecimal(
          this.orderCalculator.toCents(unitPrice),
        ), // Store exact decimal
        lineTotal: this.orderCalculator.toDecimal(lineSubtotalCents),
        unit: pricing.unit,
      });
    }

    // Calculate totals using the pure domain service in minor units
    const calcResult = this.orderCalculator.calculateOrderTotals(
      calcItems,
      dto.isExpress || false,
      expressSurchargePercent,
      null, // No promotion applied at creation time
      deliveryFee,
    );

    const orderData = {
      customerId,
      businessId: dto.businessId,
      branchId: dto.branchId,
      orderNumber: `ORD-${Date.now()}`,
      status: OrderStatus.Draft,
      paymentMethod: 'Full', // Default value, customer selects later
      paymentStatus: PaymentStatus.Pending,
      subtotal: this.orderCalculator.toDecimal(calcResult.subtotalCents) as any,
      deliveryFee: this.orderCalculator.toDecimal(
        calcResult.deliveryFeeCents,
      ) as any,
      discount: this.orderCalculator.toDecimal(calcResult.discountCents) as any,
      total: this.orderCalculator.toDecimal(calcResult.totalCents) as any,
      isExpress: dto.isExpress || false,
      scheduledPickupAt: new Date(dto.scheduledPickupAt),
      scheduledDeliveryAt: new Date(dto.scheduledPickupAt), // Can be updated later
      pickupAddressId: dto.pickupAddressId,
      deliveryAddressId: dto.deliveryAddressId,
      notes: dto.specialInstructions || null,
      items: {
        create: itemsData.map((item) => ({
          laundryServiceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice as any,
          lineTotal: item.lineTotal as any,
          unit: item.unit,
        })),
      },
      timeline: {
        create: [
          { status: OrderStatus.Draft, notes: 'Order created as Draft' },
        ],
      },
    };

    return this.orderRepo.create(orderData);
  }
}
