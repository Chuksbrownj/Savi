import { Injectable, Logger } from '@nestjs/common';
import {
  IPaymentInitiationService,
  PaymentIntentResponse,
} from './payment-initiation.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StubPaymentInitiationService implements IPaymentInitiationService {
  private readonly logger = new Logger(StubPaymentInitiationService.name);

  async initiatePayment(
    orderId: string,
    amount: number,
    customerId: string,
  ): Promise<PaymentIntentResponse> {
    this.logger.debug(
      `[STUB] Initiating payment for order ${orderId}, amount: ${amount}`,
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      transactionId: `txn_stub_${uuidv4()}`,
      paymentUrl: `https://stub-payment-gateway.com/pay/${orderId}`,
    };
  }
}
