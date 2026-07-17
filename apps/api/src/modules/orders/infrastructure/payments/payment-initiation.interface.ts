export const PAYMENT_INITIATION_SERVICE = Symbol('PAYMENT_INITIATION_SERVICE');

export interface PaymentIntentResponse {
  transactionId: string;
  paymentUrl: string;
}

export interface IPaymentInitiationService {
  initiatePayment(
    orderId: string,
    amount: number,
    customerId: string,
  ): Promise<PaymentIntentResponse>;
}
