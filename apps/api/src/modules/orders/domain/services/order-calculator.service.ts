import { Injectable } from '@nestjs/common';

export interface OrderItemCalcInfo {
  quantity: number;
  unitPrice: number | string | any; // Prisma Decimal compatibility
}

export interface PromotionCalcInfo {
  discountType: 'Percent' | 'Fixed' | string;
  discountValue: number | string | any; // Prisma Decimal compatibility
}

export interface OrderCalculationResult {
  baseSubtotalCents: number;
  expressSurchargeCents: number;
  subtotalCents: number; // base + express surcharge
  discountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
}

@Injectable()
export class OrderCalculatorService {
  /**
   * Performs all monetary calculations in minor units (cents) to avoid floating point errors.
   */
  calculateOrderTotals(
    items: OrderItemCalcInfo[],
    isExpress: boolean,
    expressSurchargePercent: number | string | any = 0,
    promotion?: PromotionCalcInfo | null,
    deliveryFee: number | string | any = 0,
  ): OrderCalculationResult {
    let baseSubtotalCents = 0;

    // 1. Calculate base subtotal in cents
    for (const item of items) {
      if (item.quantity <= 0) {
        continue; // ignore zero or negative quantities
      }

      const unitPriceCents = this.toCents(item.unitPrice);
      baseSubtotalCents += unitPriceCents * item.quantity;
    }

    // 2. Apply express surcharge to subtotal
    let expressSurchargeCents = 0;
    if (isExpress && Number(expressSurchargePercent) > 0) {
      const surchargePercent = Number(expressSurchargePercent);
      expressSurchargeCents = Math.round(
        (baseSubtotalCents * surchargePercent) / 100,
      );
    }

    // Subtotal is what the customer considers the "price before discounts"
    const subtotalCents = baseSubtotalCents + expressSurchargeCents;

    // 3. Apply promotion discount
    let discountCents = 0;
    if (promotion) {
      if (promotion.discountType === 'Percent') {
        const percent = Number(promotion.discountValue);
        discountCents = Math.round((subtotalCents * percent) / 100);
      } else if (promotion.discountType === 'Fixed') {
        discountCents = this.toCents(promotion.discountValue);
      }

      // Discount cannot exceed the subtotal
      if (discountCents > subtotalCents) {
        discountCents = subtotalCents;
      }
    }

    // 4. Add delivery fee
    const deliveryFeeCents = this.toCents(deliveryFee);

    // 5. Final total
    const totalCents = subtotalCents - discountCents + deliveryFeeCents;

    return {
      baseSubtotalCents,
      expressSurchargeCents,
      subtotalCents,
      discountCents,
      deliveryFeeCents,
      totalCents,
    };
  }

  /**
   * Helper specifically for applying/re-applying a promotion to an existing subtotal
   */
  calculateDiscountFromTotal(
    currentSubtotalDecimal: number | string | any,
    promotion: PromotionCalcInfo,
  ): { discountCents: number; totalCents: number } {
    const subtotalCents = this.toCents(currentSubtotalDecimal);
    let discountCents = 0;

    if (promotion.discountType === 'Percent') {
      const percent = Number(promotion.discountValue);
      discountCents = Math.round((subtotalCents * percent) / 100);
    } else if (promotion.discountType === 'Fixed') {
      discountCents = this.toCents(promotion.discountValue);
    }

    if (discountCents > subtotalCents) {
      discountCents = subtotalCents;
    }

    const totalCents = subtotalCents - discountCents;
    return { discountCents, totalCents };
  }

  // Helper to convert Prisma Decimal or Number to integer cents
  toCents(amount: number | string | any): number {
    if (amount === undefined || amount === null) return 0;
    const value = typeof amount === 'number' ? amount : Number(amount);
    if (isNaN(value)) return 0;
    return Math.round(value * 100);
  }

  // Helper to convert cents back to Prisma Decimal compatible number
  toDecimal(cents: number): number {
    return cents / 100;
  }
}
