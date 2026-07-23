import { Test, TestingModule } from '@nestjs/testing';
import { OrdersWebhooksController } from './orders-webhooks.controller';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { OrderWorkflowService } from '../../domain/services/order-workflow.service';

describe('OrdersWebhooksController', () => {
  let controller: OrdersWebhooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersWebhooksController],
      providers: [
        {
          provide: PrismaService,
          useValue: { order: { findMany: jest.fn().mockResolvedValue([]) } },
        },
        {
          provide: OrderWorkflowService,
          useValue: { transition: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    controller = module.get<OrdersWebhooksController>(OrdersWebhooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
