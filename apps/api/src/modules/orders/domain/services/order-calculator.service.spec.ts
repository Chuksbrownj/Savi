import { OrderCalculatorService } from './order-calculator.service';

describe('OrderCalculatorService', () => {
  let service: OrderCalculatorService;

  beforeEach(() => {
    service = new OrderCalculatorService();
  });

  describe('toCents', () => {
    it('should convert standard decimals correctly without floating point precision issues', () => {
      // 10.50 * 100 = 1050
      expect(service.toCents(10.5)).toBe(1050);
      // 0.1 + 0.2 = 0.30000000000000004 in standard JS, but with direct conversion we handle it cleanly
      expect(service.toCents(0.1 + 0.2)).toBe(30);
    });

    it('should handle strings representing decimals', () => {
      expect(service.toCents('19.99')).toBe(1999);
    });
  });

  describe('calculateOrderTotals', () => {
    it('should calculate basic subtotal correctly', () => {
      const items = [
        { quantity: 2, unitPrice: 15.5 }, // 31.00
        { quantity: 1, unitPrice: '10.00' }, // 10.00
      ];

      const result = service.calculateOrderTotals(items, false);
      expect(result.subtotalCents).toBe(4100);
      expect(result.totalCents).toBe(4100);
    });

    it('should ignore items with zero or negative quantity', () => {
      const items = [
        { quantity: 2, unitPrice: 10.0 }, // 20.00
        { quantity: 0, unitPrice: 100.0 }, // 0
        { quantity: -1, unitPrice: 50.0 }, // 0
      ];

      const result = service.calculateOrderTotals(items, false);
      expect(result.subtotalCents).toBe(2000);
    });

    it('should apply express surcharge correctly and stack it before discount', () => {
      const items = [
        { quantity: 1, unitPrice: 100.0 }, // 100.00
      ];

      // 50% surcharge
      const result = service.calculateOrderTotals(items, true, 50);
      expect(result.baseSubtotalCents).toBe(10000);
      expect(result.expressSurchargeCents).toBe(5000);
      expect(result.subtotalCents).toBe(15000); // 150.00
      expect(result.totalCents).toBe(15000);
    });

    it('should apply fixed discount correctly, capping at subtotal', () => {
      const items = [{ quantity: 1, unitPrice: 20.0 }];

      const result = service.calculateOrderTotals(items, false, 0, {
        discountType: 'Fixed',
        discountValue: 25.0, // Discount > subtotal
      });

      expect(result.subtotalCents).toBe(2000);
      expect(result.discountCents).toBe(2000); // capped at 2000
      expect(result.totalCents).toBe(0);
    });

    it('should apply percent discount stacked on express surcharge', () => {
      const items = [{ quantity: 1, unitPrice: 100.0 }]; // 100.00

      // 20% surcharge, 10% discount
      const result = service.calculateOrderTotals(items, true, 20, {
        discountType: 'Percent',
        discountValue: 10,
      });

      expect(result.baseSubtotalCents).toBe(10000);
      expect(result.expressSurchargeCents).toBe(2000);
      expect(result.subtotalCents).toBe(12000); // 120.00

      // 10% of 120 = 12.00
      expect(result.discountCents).toBe(1200);

      // Total = 120 - 12 = 108.00
      expect(result.totalCents).toBe(10800);
    });

    it('should apply delivery fee', () => {
      const items = [{ quantity: 1, unitPrice: 10.0 }];
      const result = service.calculateOrderTotals(items, false, 0, null, 5.0);

      expect(result.deliveryFeeCents).toBe(500);
      expect(result.totalCents).toBe(1500);
    });
  });
});
