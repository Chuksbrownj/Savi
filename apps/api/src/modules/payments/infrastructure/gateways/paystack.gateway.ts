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
export class PaystackGateway implements IPaymentGateway, IPayoutGateway {
  private readonly logger = new Logger(PaystackGateway.name);
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private readonly configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>('paystack.secretKey') || 'sk_test_default';
  }

  async initiate(
    orderId: string,
    amount: number,
    currency: string, // NGN mostly for Paystack
    method: PaymentMethod,
    customerEmail: string,
  ): Promise<PaymentInitiationResult> {
    this.logger.log(`Initiating Paystack payment for order ${orderId}`);

    // Convert amount to minor units (kobo)
    const amountInMinor = Math.round(amount * 100);

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: amountInMinor,
        currency,
        metadata: {
          orderId,
          method,
        },
      }),
    });

    const data = await response.json();
    if (!data.status) {
      this.logger.error(`Paystack initiate failed: ${data.message}`);
      throw new Error(data.message || 'Failed to initiate payment');
    }

    return {
      reference: data.data.reference,
      redirectUrl: data.data.authorization_url,
    };
  }

  async verify(reference: string): Promise<PaymentVerificationResult> {
    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      },
    );

    const data = await response.json();

    if (!data.status || !data.data) {
      return {
        success: false,
        amount: 0,
        currency: 'NGN',
        status: 'Failed',
        rawPayload: data,
      };
    }

    return {
      success: data.data.status === 'success',
      amount: data.data.amount / 100, // convert back to major
      currency: data.data.currency,
      status: data.data.status,
      rawPayload: data.data,
    };
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    return hash === signature;
  }

  async payout(
    amount: number,
    currency: string,
    recipientId: string,
    reason: string,
  ): Promise<PayoutResult> {
    this.logger.log(`Initiating Paystack payout for ${recipientId}`);

    const amountInMinor = Math.round(amount * 100);

    const response = await fetch(`${this.baseUrl}/transfer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amountInMinor,
        recipient: recipientId, // Paystack transfer recipient code
        reason,
        currency,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      this.logger.error(`Paystack payout failed: ${data.message}`);
      throw new Error(data.message || 'Failed to initiate payout');
    }

    return {
      success: true,
      reference: data.data.reference,
      rawPayload: data.data,
    };
  }

  async refund(paymentReference: string, amount: number): Promise<RefundResult> {
    this.logger.log(`Initiating refund for payment ${paymentReference}`);

    const amountInMinor = Math.round(amount * 100);

    const response = await fetch(`${this.baseUrl}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: paymentReference,
        amount: amountInMinor,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      this.logger.error(`Paystack refund failed: ${data.message}`);
      throw new Error(data.message || 'Failed to initiate refund');
    }

    return {
      success: true,
      reference: data.data.transaction?.reference || paymentReference,
      rawPayload: data.data,
    };
  }
}
