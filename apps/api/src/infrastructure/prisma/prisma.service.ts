import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * PrismaService — Database access layer.
 *
 * Prisma v7 uses a WASM-based Query Compiler (engineType="client") instead of
 * the legacy Rust binary engine. This means PrismaClient MUST be constructed
 * with a Driver Adapter — the adapter is the bridge between the WASM compiler
 * and the actual TCP database driver.
 *
 * For PostgreSQL we use:
 *   pg.Pool  →  @prisma/adapter-pg (PrismaPg)  →  PrismaClient
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor(private readonly config: ConfigService) {
    const connectionString = config.getOrThrow<string>('DATABASE_URL');

    // Create the native pg connection pool
    const pool = new Pool({ connectionString });

    // Wrap it with Prisma's adapter
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: [
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });

    // Keep a reference so we can end the pool gracefully on shutdown
    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Database disconnected');
  }
}
