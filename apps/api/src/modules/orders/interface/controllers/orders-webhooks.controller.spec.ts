import { Test, TestingModule } from '@nestjs/testing';
import { OrdersWebhooksController } from './orders-webhooks.controller';
import { OrderAutoCompletionProcessor } from '../../application/processors/order-auto-completion.processor';

describe('OrdersWebhooksController', () => {
  let controller: OrdersWebhooksController;
  let processor: OrderAutoCompletionProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersWebhooksController],
      providers: [
        {
          provide: OrderAutoCompletionProcessor,
          useValue: {
            processAutoCompletion: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersWebhooksController>(OrdersWebhooksController);
    processor = module.get<OrderAutoCompletionProcessor>(OrderAutoCompletionProcessor);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call processAutoCompletion on webhook', async () => {
    const payload = { orderId: '123' };
    await controller.handleOrderAutoCompletion(payload);
    expect(processor.processAutoCompletion).toHaveBeenCalledWith('123');
  });
});
