import { Module } from '@nestjs/common';
import { CustomerOrderController } from './interface/controllers/customer-order.controller';
import { OrdersWebhooksController } from './interface/controllers/orders-webhooks.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { ORDER_REPOSITORY } from './domain/repositories/order.repository.interface';
import { PrismaOrderRepository } from './infrastructure/repositories/prisma-order.repository';

import { PROMOTION_REPOSITORY } from './domain/repositories/promotion.repository.interface';
import { PrismaPromotionRepository } from './infrastructure/repositories/prisma-promotion.repository';

import { RATING_REPOSITORY } from './domain/repositories/rating.repository.interface';
import { PrismaRatingRepository } from './infrastructure/repositories/prisma-rating.repository';

import { PAYMENT_INITIATION_SERVICE } from './infrastructure/payments/payment-initiation.interface';
import { StubPaymentInitiationService } from './infrastructure/payments/stub-payment-initiation.service';

import { OrderCalculatorService } from './domain/services/order-calculator.service';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { UpdateDraftOrderUseCase } from './application/use-cases/update-draft-order.use-case';
import { ApplyPromotionUseCase } from './application/use-cases/apply-promotion.use-case';
import { SelectPaymentMethodUseCase } from './application/use-cases/select-payment-method.use-case';
import { GetCustomerOrdersUseCase } from './application/use-cases/get-customer-orders.use-case';
import { GetCustomerOrderDetailsUseCase } from './application/use-cases/get-customer-order-details.use-case';
import { GetOrderTimelineUseCase } from './application/use-cases/get-order-timeline.use-case';
import { ConfirmOrderReceiptUseCase } from './application/use-cases/confirm-order-receipt.use-case';
import { CancelOrderUseCase } from './application/use-cases/cancel-order.use-case';
import { RateOrderUseCase } from './application/use-cases/rate-order.use-case';
import { OrderWorkflowService } from './domain/services/order-workflow.service';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerOrderController, OrdersWebhooksController],
  providers: [
    {
      provide: ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
    {
      provide: PROMOTION_REPOSITORY,
      useClass: PrismaPromotionRepository,
    },
    {
      provide: RATING_REPOSITORY,
      useClass: PrismaRatingRepository,
    },
    {
      provide: PAYMENT_INITIATION_SERVICE,
      useClass: StubPaymentInitiationService,
    },
    OrderCalculatorService,
    CreateOrderUseCase,
    UpdateDraftOrderUseCase,
    ApplyPromotionUseCase,
    SelectPaymentMethodUseCase,
    GetCustomerOrdersUseCase,
    GetCustomerOrderDetailsUseCase,
    GetOrderTimelineUseCase,
    ConfirmOrderReceiptUseCase,
    CancelOrderUseCase,
    RateOrderUseCase,
    OrderWorkflowService,
  ],
  exports: [ORDER_REPOSITORY, PAYMENT_INITIATION_SERVICE, OrderWorkflowService],
})
export class OrdersModule {}
