import { Test, TestingModule } from '@nestjs/testing';
import { AssignDispatchRiderUseCase } from './assign-dispatch-rider.use-case';
import { IBusinessOrderRepository } from '../../domain/repositories/business-order.repository.interface';
import { IBusinessDispatchRepository } from '../../domain/repositories/business-dispatch.repository.interface';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { DispatchTaskType, OrderStatus } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AssignDispatchRiderUseCase', () => {
  let useCase: AssignDispatchRiderUseCase;
  let orderRepo: jest.Mocked<IBusinessOrderRepository>;
  let dispatchRepo: jest.Mocked<IBusinessDispatchRepository>;
  let prismaService: any;

  beforeEach(async () => {
    orderRepo = {
      findById: jest.fn(),
    } as any;

    dispatchRepo = {
      createTask: jest.fn(),
    } as any;

    prismaService = {
      dispatchRiderProfile: {
        findFirst: jest.fn(),
      },
      dispatchTask: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignDispatchRiderUseCase,
        { provide: 'IBusinessOrderRepository', useValue: orderRepo },
        { provide: 'IBusinessDispatchRepository', useValue: dispatchRepo },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    useCase = module.get<AssignDispatchRiderUseCase>(
      AssignDispatchRiderUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should throw NotFoundException if order does not exist', async () => {
    orderRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('biz-1', 'order-1', 'rider-1', DispatchTaskType.Pickup),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if rider is invalid or inactive', async () => {
    orderRepo.findById.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.AwaitingPickupAssignment,
    } as any);
    prismaService.dispatchRiderProfile.findFirst.mockResolvedValue(null); // Rider not found

    await expect(
      useCase.execute('biz-1', 'order-1', 'rider-1', DispatchTaskType.Pickup),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if order is not ready for pickup assignment', async () => {
    orderRepo.findById.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.Draft,
    } as any);
    prismaService.dispatchRiderProfile.findFirst.mockResolvedValue({
      id: 'rider-1',
    } as any);

    await expect(
      useCase.execute('biz-1', 'order-1', 'rider-1', DispatchTaskType.Pickup),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if order already has an active task of this type', async () => {
    orderRepo.findById.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.AwaitingPickupAssignment,
    } as any);
    prismaService.dispatchRiderProfile.findFirst.mockResolvedValue({
      id: 'rider-1',
    } as any);
    prismaService.dispatchTask.findFirst.mockResolvedValue({
      id: 'task-1',
    } as any); // Task exists

    await expect(
      useCase.execute('biz-1', 'order-1', 'rider-1', DispatchTaskType.Pickup),
    ).rejects.toThrow(BadRequestException);
  });

  it('should successfully create a dispatch task', async () => {
    orderRepo.findById.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.AwaitingPickupAssignment,
    } as any);
    prismaService.dispatchRiderProfile.findFirst.mockResolvedValue({
      id: 'rider-1',
    } as any);
    prismaService.dispatchTask.findFirst.mockResolvedValue(null); // No existing task

    const mockTask = { id: 'task-1', status: 'Assigned' };
    prismaService.dispatchTask.create.mockResolvedValue(mockTask);

    const result = await useCase.execute(
      'biz-1',
      'order-1',
      'rider-1',
      DispatchTaskType.Pickup,
    );

    expect(result).toEqual(mockTask);
    expect(prismaService.dispatchTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        businessId: 'biz-1',
        riderId: 'rider-1',
        type: DispatchTaskType.Pickup,
        status: 'Assigned',
      }),
    });
  });
});
