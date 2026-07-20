import { Module } from '@nestjs/common';
import { DispatchController } from './interface/controllers/dispatch.controller';
import { UpdateRiderAvailabilityUseCase } from './application/use-cases/update-rider-availability.use-case';
import { UpdateRiderLocationUseCase } from './application/use-cases/update-rider-location.use-case';
import { GetRiderJobsUseCase } from './application/use-cases/get-rider-jobs.use-case';
import { AcceptRejectJobUseCase } from './application/use-cases/accept-reject-job.use-case';
import { StartJobUseCase } from './application/use-cases/start-job.use-case';
import { ConfirmJobUseCase } from './application/use-cases/confirm-job.use-case';
import { ReportIssueUseCase } from './application/use-cases/report-issue.use-case';
import { GetRiderEarningsUseCase } from './application/use-cases/get-rider-earnings.use-case';
import { DISPATCH_REPOSITORY } from './domain/repositories/dispatch.repository.interface';
import { PrismaDispatchRepository } from './infrastructure/repositories/prisma-dispatch.repository';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [PrismaModule, OrdersModule],
  controllers: [DispatchController],
  providers: [
    {
      provide: DISPATCH_REPOSITORY,
      useClass: PrismaDispatchRepository,
    },
    UpdateRiderAvailabilityUseCase,
    UpdateRiderLocationUseCase,
    GetRiderJobsUseCase,
    AcceptRejectJobUseCase,
    StartJobUseCase,
    ConfirmJobUseCase,
    ReportIssueUseCase,
    GetRiderEarningsUseCase,
  ],
  exports: [],
})
export class DispatchModule {}
