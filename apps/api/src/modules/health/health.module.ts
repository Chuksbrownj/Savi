import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

/**
 * Health Module — exposes /health and /metrics endpoints.
 * Uses @nestjs/terminus to check:
 *  - PostgreSQL (via Prisma)
 *  - Redis (via ioredis)
 *  - Disk storage
 */
@Module({
  imports: [
    TerminusModule.forRoot({
      gracefulShutdownTimeoutMs: 1000,
    }),
    HttpModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
