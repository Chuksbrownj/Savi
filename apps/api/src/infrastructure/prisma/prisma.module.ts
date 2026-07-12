import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule — Global database module.
 * Exports PrismaService so it can be injected anywhere without re-importing.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
