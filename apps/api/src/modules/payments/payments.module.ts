import { Module } from '@nestjs/common';
import { GatewayFactory } from './infrastructure/gateways/gateway-factory';
import { PaystackGateway } from './infrastructure/gateways/paystack.gateway';
import { FlutterwaveGateway } from './infrastructure/gateways/flutterwave.gateway';
import { StripeGateway } from './infrastructure/gateways/stripe.gateway';
import { InitiatePaymentUseCase } from './application/use-cases/initiate-payment.use-case';
import { ProcessPaymentWebhookUseCase } from './application/use-cases/process-payment-webhook.use-case';
import { ProcessPayoutWebhookUseCase } from './application/use-cases/process-payout-webhook.use-case';
import { GenerateSettlementsUseCase } from './application/use-cases/generate-settlements.use-case';
import { ProcessSettlementUseCase } from './application/use-cases/process-settlement.use-case';
import { RefundPaymentUseCase } from './application/use-cases/refund-payment.use-case';
import { CustomerPaymentsController } from './interface/controllers/customer-payments.controller';
import { WebhooksController } from './interface/controllers/webhooks.controller';
import { BusinessSettlementsController } from './interface/controllers/business-settlements.controller';
import { BusinessRefundsController } from './interface/controllers/business-refunds.controller';
import { OrdersModule } from '../orders/orders.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    OrdersModule,
    ConfigModule,
  ],
  controllers: [
    CustomerPaymentsController,
    WebhooksController,
    BusinessSettlementsController,
    BusinessRefundsController,
  ],
  providers: [
    GatewayFactory,
    PaystackGateway,
    FlutterwaveGateway,
    StripeGateway,
    InitiatePaymentUseCase,
    ProcessPaymentWebhookUseCase,
    ProcessPayoutWebhookUseCase,
    GenerateSettlementsUseCase,
    ProcessSettlementUseCase,
    RefundPaymentUseCase,
  ],
  exports: [],
})
export class PaymentsModule {}
