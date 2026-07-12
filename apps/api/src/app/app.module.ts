import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { configModuleOptions } from '../config/validation.schema';
import {
  databaseConfig,
  redisConfig,
  jwtConfig,
  storageConfig,
  paymentsConfig,
  notificationsConfig,
  mapsConfig,
  throttlerConfig,
} from '../config/configuration';

import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { QueueModule } from '../infrastructure/queue/queue.module';

import { HealthModule } from '../modules/health/health.module';
import { IdentityModule } from '../modules/identity/identity.module';
import { CatalogModule } from '../modules/catalog/catalog.module';
import { OrdersModule } from '../modules/orders/orders.module';
import { DispatchModule } from '../modules/dispatch/dispatch.module';
import { PaymentsModule } from '../modules/payments/payments.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { BusinessModule } from '../modules/business/business.module';
import { SupportModule } from '../modules/support/support.module';
import { SharedKernelModule } from '../modules/shared-kernel/shared-kernel.module';

import { RequestIdMiddleware } from '../common/middleware/request-id.middleware';

@Module({
  imports: [
    // ── Configuration ─────────────────────────────────────────────────────
    ConfigModule.forRoot({
      ...configModuleOptions,
      load: [
        databaseConfig,
        redisConfig,
        jwtConfig,
        storageConfig,
        paymentsConfig,
        notificationsConfig,
        mapsConfig,
        throttlerConfig,
      ],
    }),

    // ── Logging (Pino) ────────────────────────────────────────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: (req) => ({
          requestId: req.headers['x-request-id'],
        }),
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
      },
    }),

    // ── Infrastructure ────────────────────────────────────────────────────
    PrismaModule,
    QueueModule,

    // ── Feature Modules ───────────────────────────────────────────────────
    SharedKernelModule,
    HealthModule,
    IdentityModule,
    CatalogModule,
    OrdersModule,
    DispatchModule,
    PaymentsModule,
    NotificationsModule,
    BusinessModule,
    SupportModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
