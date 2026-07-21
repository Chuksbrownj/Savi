import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { OrdersModule } from '../orders/orders.module';
import { CacheModule } from '@nestjs/cache-manager';

// Controllers
import { BusinessOrdersController } from './interface/controllers/business-orders.controller';
import { BusinessDispatchController } from './interface/controllers/business-dispatch.controller';
import { BusinessPricingController } from './interface/controllers/business-pricing.controller';
import { BusinessBranchesController } from './interface/controllers/business-branches.controller';
import { BusinessStaffController } from './interface/controllers/business-staff.controller';
import { BusinessCustomersController } from './interface/controllers/business-customers.controller';
import { BusinessPromoSettleController } from './interface/controllers/business-promo-settle.controller';
import { BusinessDashboardController } from './interface/controllers/business-dashboard.controller';
import { BusinessAuditController } from './interface/controllers/business-audit.controller';
import { BusinessReportsController } from './interface/controllers/business-reports.controller';
import { BusinessWebhooksController } from './interface/controllers/business-webhooks.controller';

// Use Cases
import { GetBusinessOrdersUseCase } from './application/use-cases/get-business-orders.use-case';
import { GetBusinessOrderDetailsUseCase } from './application/use-cases/get-business-order-details.use-case';
import { ApproveOrderUseCase } from './application/use-cases/approve-order.use-case';
import { RejectOrderUseCase } from './application/use-cases/reject-order.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { ConfirmPaymentUseCase } from './application/use-cases/confirm-payment.use-case';
import { AssignDispatchRiderUseCase } from './application/use-cases/assign-dispatch-rider.use-case';
import { AutoAssignDispatchRiderUseCase } from './application/use-cases/auto-assign-dispatch-rider.use-case';
import { ReassignDispatchTaskUseCase } from './application/use-cases/reassign-dispatch-task.use-case';
import { CancelDispatchTaskUseCase } from './application/use-cases/cancel-dispatch-task.use-case';
import { ManageServicesPricingUseCases } from './application/use-cases/manage-services-pricing.use-cases';
import { ManageBranchesUseCases } from './application/use-cases/manage-branches.use-cases';
import { ManageStaffUseCases } from './application/use-cases/manage-staff.use-cases';
import { BusinessCustomersUseCases } from './application/use-cases/business-customers.use-cases';
import { ManagePromotionsUseCases } from './application/use-cases/manage-promotions.use-cases';
import { ManageSettlementsUseCases } from './application/use-cases/manage-settlements.use-cases';
import { AnalyticsDashboardUseCases } from './application/use-cases/analytics-dashboard.use-cases';
import { BusinessAuditUseCases } from './application/use-cases/business-audit.use-cases';
import { GenerateReportUseCase } from './application/use-cases/generate-report.use-case';

// Repositories
import { PrismaBusinessOrderRepository } from './infrastructure/repositories/prisma-business-order.repository';
import { PrismaBusinessDispatchRepository } from './infrastructure/repositories/prisma-business-dispatch.repository';
import { PrismaBusinessServicePricingRepository } from './infrastructure/repositories/prisma-business-service-pricing.repository';
import { PrismaBusinessStaffRepository } from './infrastructure/repositories/prisma-business-staff.repository';
import { PrismaBusinessPromoSettleRepository } from './infrastructure/repositories/prisma-business-promo-settle.repository';

@Module({
  imports: [
    PrismaModule,
    IdentityModule,
    OrdersModule,
    CacheModule.register(),
  ],
  controllers: [
    BusinessOrdersController,
    BusinessDispatchController,
    BusinessPricingController,
    BusinessBranchesController,
    BusinessStaffController,
    BusinessCustomersController,
    BusinessPromoSettleController,
    BusinessDashboardController,
    BusinessAuditController,
    BusinessReportsController,
    BusinessWebhooksController,
  ],
  providers: [
    // Use Cases
    GetBusinessOrdersUseCase,
    GetBusinessOrderDetailsUseCase,
    ApproveOrderUseCase,
    RejectOrderUseCase,
    UpdateOrderStatusUseCase,
    ConfirmPaymentUseCase,
    AssignDispatchRiderUseCase,
    AutoAssignDispatchRiderUseCase,
    ReassignDispatchTaskUseCase,
    CancelDispatchTaskUseCase,
    ManageServicesPricingUseCases,
    ManageBranchesUseCases,
    ManageStaffUseCases,
    BusinessCustomersUseCases,
    ManagePromotionsUseCases,
    ManageSettlementsUseCases,
    AnalyticsDashboardUseCases,
    BusinessAuditUseCases,
    GenerateReportUseCase,

    // Repositories
    {
      provide: 'IBusinessOrderRepository',
      useClass: PrismaBusinessOrderRepository,
    },
    {
      provide: 'IBusinessDispatchRepository',
      useClass: PrismaBusinessDispatchRepository,
    },
    {
      provide: 'IBusinessServiceRepository',
      useClass: PrismaBusinessServicePricingRepository,
    },
    {
      provide: 'IBusinessBranchRepository',
      useClass: PrismaBusinessServicePricingRepository,
    },
    {
      provide: 'IBusinessStaffRepository',
      useClass: PrismaBusinessStaffRepository,
    },
    {
      provide: 'IBusinessPromotionRepository',
      useClass: PrismaBusinessPromoSettleRepository,
    },
    {
      provide: 'IBusinessSettlementRepository',
      useClass: PrismaBusinessPromoSettleRepository,
    },
  ],
})
export class BusinessModule {}
