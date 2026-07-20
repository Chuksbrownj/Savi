import { Test, TestingModule } from '@nestjs/testing';
import { OrderWorkflowService } from './order-workflow.service';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UserType,
} from '@prisma/client';
import { ConflictException } from '@nestjs/common';

describe('OrderWorkflowService', () => {
  let service: OrderWorkflowService;
  let prismaService: jest.Mocked<Partial<PrismaService>>;
  let eventEmitter: jest.Mocked<Partial<EventEmitter2>>;

  beforeEach(async () => {
    prismaService = {
      order: { update: jest.fn().mockResolvedValue({}) } as any,
      orderStatusHistory: { create: jest.fn().mockResolvedValue({}) } as any,
      orderTimeline: { create: jest.fn().mockResolvedValue({}) } as any,
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderWorkflowService,
        { provide: PrismaService, useValue: prismaService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<OrderWorkflowService>(OrderWorkflowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('canTransition', () => {
    it('should allow Draft to AwaitingPayment by Customer', async () => {
      const order = { status: OrderStatus.Draft } as Order;
      const canTrans = await service.canTransition(
        order,
        OrderStatus.AwaitingPayment,
        UserType.Customer,
      );
      expect(canTrans).toBe(true);
    });

    it('should not allow Draft to AwaitingPayment by System', async () => {
      const order = { status: OrderStatus.Draft } as Order;
      const canTrans = await service.canTransition(
        order,
        OrderStatus.AwaitingPayment,
        'System',
      );
      expect(canTrans).toBe(false);
    });

    it('should allow AwaitingPayment to PaymentConfirmed if fully paid or PayOnDelivery', async () => {
      let order = {
        status: OrderStatus.AwaitingPayment,
        paymentStatus: PaymentStatus.Paid,
        paymentMethod: PaymentMethod.Full,
      } as Order;
      let canTrans = await service.canTransition(
        order,
        OrderStatus.PaymentConfirmed,
        'System',
      );
      expect(canTrans).toBe(true);

      order = {
        status: OrderStatus.AwaitingPayment,
        paymentStatus: PaymentStatus.Pending,
        paymentMethod: PaymentMethod.PayOnDelivery,
      } as Order;
      canTrans = await service.canTransition(
        order,
        OrderStatus.PaymentConfirmed,
        UserType.BusinessOwner,
      );
      expect(canTrans).toBe(true);
    });

    it('should deny AwaitingPayment to PaymentConfirmed if not paid and not PayOnDelivery', async () => {
      const order = {
        status: OrderStatus.AwaitingPayment,
        paymentStatus: PaymentStatus.Pending,
        paymentMethod: PaymentMethod.Full,
      } as Order;
      const canTrans = await service.canTransition(
        order,
        OrderStatus.PaymentConfirmed,
        'System',
      );
      expect(canTrans).toBe(false);
    });

    it('should skip processing stages directly to ReadyForDelivery', async () => {
      const order = { status: OrderStatus.LaundryReceived } as Order;
      const canTrans = await service.canTransition(
        order,
        OrderStatus.ReadyForDelivery,
        UserType.BusinessOwner,
      );
      expect(canTrans).toBe(true);
    });
  });

  describe('transition', () => {
    it('should execute transition and emit event', async () => {
      const order = { id: 'order-123', status: OrderStatus.Draft } as Order;
      const context = { notes: 'Submit order' };

      await service.transition(
        order,
        OrderStatus.AwaitingPayment,
        UserType.Customer,
        context,
      );

      expect(prismaService.order!.update).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        data: { status: OrderStatus.AwaitingPayment },
      });

      expect(prismaService.orderStatusHistory!.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-123',
          fromStatus: OrderStatus.Draft,
          toStatus: OrderStatus.AwaitingPayment,
          actorType: UserType.Customer,
          notes: 'Submit order',
        }),
      });

      expect(prismaService.orderTimeline!.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-123',
          status: OrderStatus.AwaitingPayment,
          notes: 'Submit order',
        }),
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'order.status.changed',
        expect.objectContaining({
          orderId: 'order-123',
          fromStatus: OrderStatus.Draft,
          toStatus: OrderStatus.AwaitingPayment,
          actor: UserType.Customer,
        }),
      );
    });

    it('should throw ConflictException on invalid transition', async () => {
      const order = { id: 'order-123', status: OrderStatus.Draft } as Order;

      await expect(
        service.transition(
          order,
          OrderStatus.PaymentConfirmed,
          UserType.Customer,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
