import { Module } from '@nestjs/common';

/**
 * Payments Bounded Context
 * Handles payment processing (Paystack/Flutterwave/Stripe) and rider settlements.
 * Customers pay the business only — riders are settled separately.
 * Implementation details filled in Phase 8 (Payments & Settlements).
 */
@Module({})
export class PaymentsModule {}
