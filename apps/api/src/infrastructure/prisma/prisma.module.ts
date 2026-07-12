import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule — Global database module.
 * Exports PrismaService so it can be injected anywhere without re-importing.
 *
 * ConfigModule is imported here because PrismaService requires ConfigService
 * to read DATABASE_URL at construction time (Prisma v7 WASM engine requirement).
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
