import { Injectable, BadRequestException } from '@nestjs/common';
import {
  IPaymentGateway,
  IPayoutGateway,
} from '../../domain/interfaces/payment-gateway.interface';
import { PaystackGateway } from './paystack.gateway';
import { FlutterwaveGateway } from './flutterwave.gateway';
import { StripeGateway } from './stripe.gateway';

@Injectable()
export class GatewayFactory {
  constructor(
    private readonly paystack: PaystackGateway,
    private readonly flutterwave: FlutterwaveGateway,
    private readonly stripe: StripeGateway,
  ) {}

  getPaymentGateway(provider: string): IPaymentGateway {
    switch (provider.toLowerCase()) {
      case 'paystack':
        return this.paystack;
      case 'flutterwave':
        return this.flutterwave;
      case 'stripe':
        return this.stripe;
      default:
        throw new BadRequestException(
          `Unsupported payment provider: ${provider}`,
        );
    }
  }

  getPayoutGateway(provider: string): IPayoutGateway {
    switch (provider.toLowerCase()) {
      case 'paystack':
        return this.paystack;
      case 'flutterwave':
        return this.flutterwave;
      case 'stripe':
        return this.stripe;
      default:
        throw new BadRequestException(
          `Unsupported payout provider: ${provider}`,
        );
    }
  }
}
