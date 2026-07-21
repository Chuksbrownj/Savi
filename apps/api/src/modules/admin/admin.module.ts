import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { AdminController } from './interface/controllers/admin.controller';
import { AdminPlatformUseCases } from './application/use-cases/admin-platform.use-cases';
import { PrismaAdminRepository } from './infrastructure/repositories/prisma-admin.repository';

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [AdminController],
  providers: [
    AdminPlatformUseCases,
    {
      provide: 'IAdminRepository',
      useClass: PrismaAdminRepository,
    },
  ],
})
export class AdminModule {}
