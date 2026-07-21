import { PaymentMethod } from '@prisma/client';

export interface PaymentInitiationResult {
  reference: string;
  redirectUrl?: string;
  clientSecret?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  amount: number;
  currency: string;
  status: string;
  rawPayload?: any;
}

export interface PayoutResult {
  success: boolean;
  reference: string;
  rawPayload?: any;
}

export interface RefundResult {
  success: boolean;
  reference: string;
  rawPayload?: any;
}

export interface IPaymentGateway {
  initiate(
    orderId: string,
    amount: number,
    currency: string,
    method: PaymentMethod,
    customerEmail: string,
  ): Promise<PaymentInitiationResult>;

  verify(reference: string): Promise<PaymentVerificationResult>;

  verifyWebhookSignature(payload: any, signature: string): boolean;

  refund(paymentReference: string, amount: number): Promise<RefundResult>;
}

export interface IPayoutGateway {
  payout(
    amount: number,
    currency: string,
    recipientId: string, // External account ID or bank code
    reason: string,
  ): Promise<PayoutResult>;
}
