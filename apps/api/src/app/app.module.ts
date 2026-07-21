import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { configModuleOptions } from '../config/validation.schema';
import {
  databaseConfig,
  jwtConfig,
  storageConfig,
  paymentsConfig,
  notificationsConfig,
  mapsConfig,
  throttlerConfig,
} from '../config/configuration';

import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { QStashModule } from '../infrastructure/qstash/qstash.module';

import { HealthModule } from '../modules/health/health.module';
import { IdentityModule } from '../modules/identity/identity.module';
import { CustomerModule } from '../modules/customer/customer.module';
import { CatalogModule } from '../modules/catalog/catalog.module';
import { OrdersModule } from '../modules/orders/orders.module';
import { DispatchModule } from '../modules/dispatch/dispatch.module';
import { PaymentsModule } from '../modules/payments/payments.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { BusinessModule } from '../modules/business/business.module';
import { SupportModule } from '../modules/support/support.module';
import { SharedKernelModule } from '../modules/shared-kernel/shared-kernel.module';
import { AdminModule } from '../modules/admin/admin.module';

import { RequestIdMiddleware } from '../common/middleware/request-id.middleware';
import { JwtAuthGuard } from '../modules/identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../modules/identity/interface/guards/roles.guard';
import { AuditLogInterceptor } from '../common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    // ── Configuration ─────────────────────────────────────────────────────
    ConfigModule.forRoot({
      ...configModuleOptions,
      load: [
        databaseConfig,
        jwtConfig,
        storageConfig,
        paymentsConfig,
        notificationsConfig,
        mapsConfig,
        throttlerConfig,
      ],
    }),

    // ── Rate Limiting ─────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttler.ttl', 60) * 1000,
            limit: config.get<number>('throttler.limit', 100),
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // ── Logging (Pino) ────────────────────────────────────────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: (req: any) => ({
          requestId: req.headers['x-request-id'],
        }),
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? {
                target: 'pino-pretty',
                options: { colorize: true, singleLine: true },
              }
            : undefined,
      } as any,
    }),

    // ── Infrastructure ────────────────────────────────────────────────────
    PrismaModule,
    QStashModule,
    EventEmitterModule.forRoot(),

    // ── Feature Modules ───────────────────────────────────────────────────
    SharedKernelModule,
    HealthModule,
    IdentityModule,
    CustomerModule,
    CatalogModule,
    OrdersModule,
    DispatchModule,
    PaymentsModule,
    NotificationsModule,
    BusinessModule,
    AdminModule,
    SupportModule,
  ],
  providers: [
    // ── Global Guards (applied to every route) ─────────────────────────────
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // ── Global Interceptors ────────────────────────────────────────────────
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
