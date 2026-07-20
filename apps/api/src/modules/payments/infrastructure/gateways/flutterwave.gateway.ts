import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentGateway,
  IPayoutGateway,
  PaymentInitiationResult,
  PaymentVerificationResult,
  PayoutResult,
} from '../../domain/interfaces/payment-gateway.interface';
import { PaymentMethod } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class FlutterwaveGateway implements IPaymentGateway, IPayoutGateway {
  private readonly logger = new Logger(FlutterwaveGateway.name);
  private readonly secretKey: string;
  private readonly hashKey: string;
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  constructor(private readonly configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>('flutterwave.secretKey') ||
      'FLWSECK_TEST_default';
    this.hashKey =
      this.configService.get<string>('flutterwave.hashKey') ||
      'FLW_HASH_default';
  }

  async initiate(
    orderId: string,
    amount: number,
    currency: string,
    method: PaymentMethod,
    customerEmail: string,
  ): Promise<PaymentInitiationResult> {
    this.logger.log(`Initiating Flutterwave payment for order ${orderId}`);

    const txRef = `FLW-${orderId}-${Date.now()}`;

    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency,
        redirect_url: 'https://savi-app.com/payment/callback',
        customer: {
          email: customerEmail,
        },
        meta: {
          orderId,
          method,
        },
      }),
    });

    const data = await response.json();
    if (data.status !== 'success') {
      this.logger.error(`Flutterwave initiate failed: ${data.message}`);
      throw new Error(data.message || 'Failed to initiate payment');
    }

    return {
      reference: txRef,
      redirectUrl: data.data.link,
    };
  }

  async verify(reference: string): Promise<PaymentVerificationResult> {
    // Flutterwave requires transaction ID to verify, not tx_ref.
    // In a real flow, webhook/callback provides transaction_id.
    // Assuming `reference` here is the Flutterwave transaction id (number).
    const response = await fetch(
      `${this.baseUrl}/transactions/${reference}/verify`,
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      },
    );

    const data = await response.json();

    if (data.status !== 'success' || !data.data) {
      return {
        success: false,
        amount: 0,
        currency: 'NGN',
        status: 'Failed',
        rawPayload: data,
      };
    }

    return {
      success: data.data.status === 'successful',
      amount: data.data.amount,
      currency: data.data.currency,
      status: data.data.status,
      rawPayload: data.data,
    };
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    return signature === this.hashKey;
  }

  async payout(
    amount: number,
    currency: string,
    recipientId: string,
    reason: string,
  ): Promise<PayoutResult> {
    this.logger.log(`Initiating Flutterwave payout for ${recipientId}`);

    const response = await fetch(`${this.baseUrl}/transfers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: 'flutterwave', // Assuming recipientId encodes needed info or is a stored transfer recipient
        account_number: recipientId,
        amount,
        currency,
        narration: reason,
        reference: `FLW-Payout-${Date.now()}`,
      }),
    });

    const data = await response.json();

    if (data.status !== 'success') {
      this.logger.error(`Flutterwave payout failed: ${data.message}`);
      throw new Error(data.message || 'Failed to initiate payout');
    }

    return {
      success: true,
      reference: data.data.reference || String(data.data.id),
      rawPayload: data.data,
    };
  }
}
