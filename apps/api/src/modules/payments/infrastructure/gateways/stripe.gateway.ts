import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentGateway,
  IPayoutGateway,
  PaymentInitiationResult,
  PaymentVerificationResult,
  PayoutResult,
  RefundResult,
} from '../../domain/interfaces/payment-gateway.interface';
import { PaymentMethod } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class StripeGateway implements IPaymentGateway, IPayoutGateway {
  private readonly logger = new Logger(StripeGateway.name);
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl = 'https://api.stripe.com/v1';

  constructor(private readonly configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>('stripe.secretKey') || 'sk_test_default';
    this.webhookSecret =
      this.configService.get<string>('stripe.webhookSecret') || 'whsec_default';
  }

  async initiate(
    orderId: string,
    amount: number,
    currency: string,
    method: PaymentMethod,
    customerEmail: string,
  ): Promise<PaymentInitiationResult> {
    this.logger.log(`Initiating Stripe payment for order ${orderId}`);

    // Convert to cents
    const amountInCents = Math.round(amount * 100);

    // Using fetch with x-www-form-urlencoded as Stripe expects form data
    const params = new URLSearchParams();
    params.append('amount', amountInCents.toString());
    params.append('currency', currency.toLowerCase());
    params.append('receipt_email', customerEmail);
    params.append('metadata[orderId]', orderId);
    params.append('metadata[method]', method);

    const response = await fetch(`${this.baseUrl}/payment_intents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (data.error) {
      this.logger.error(`Stripe initiate failed: ${data.error.message}`);
      throw new Error(data.error.message || 'Failed to initiate payment');
    }

    return {
      reference: data.id,
      clientSecret: data.client_secret,
    };
  }

  async verify(reference: string): Promise<PaymentVerificationResult> {
    const response = await fetch(
      `${this.baseUrl}/payment_intents/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      },
    );

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        amount: 0,
        currency: 'USD',
        status: 'Failed',
        rawPayload: data,
      };
    }

    return {
      success: data.status === 'succeeded',
      amount: data.amount / 100, // convert back from cents
      currency: data.currency.toUpperCase(),
      status: data.status,
      rawPayload: data,
    };
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    // Stripe signature involves parsing the Stripe-Signature header
    // e.g. t=161...,v1=hash. Here we do a simplified check for the test
    // Real implementation should parse the timestamp and recompute the HMAC
    // For now, this satisfies the interface but realistically Stripe handles this via their SDK `stripe.webhooks.constructEvent`
    try {
      const parts = signature.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const v1Part = parts.find((p) => p.startsWith('v1='));
      if (!timestampPart || !v1Part) return false;

      const timestamp = timestampPart.split('=')[1];
      const actualSig = v1Part.split('=')[1];

      // Assuming payload here is the raw body string
      const signedPayload = `${timestamp}.${payload}`;
      const expectedSig = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(signedPayload)
        .digest('hex');

      return expectedSig === actualSig;
    } catch {
      return false;
    }
  }

  async payout(
    amount: number,
    currency: string,
    recipientId: string, // Stripe Connect account ID
    reason: string,
  ): Promise<PayoutResult> {
    this.logger.log(`Initiating Stripe transfer to ${recipientId}`);

    const amountInCents = Math.round(amount * 100);

    const params = new URLSearchParams();
    params.append('amount', amountInCents.toString());
    params.append('currency', currency.toLowerCase());
    params.append('destination', recipientId);
    params.append('description', reason);

    const response = await fetch(`${this.baseUrl}/transfers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.error) {
      this.logger.error(`Stripe transfer failed: ${data.error.message}`);
      throw new Error(data.error.message || 'Failed to initiate transfer');
    }

    return {
      success: true,
      reference: data.id,
      rawPayload: {},
    };
  }

  async refund(paymentReference: string, amount: number): Promise<RefundResult> {
    throw new Error('Refund not implemented for Stripe yet.');
  }
}
