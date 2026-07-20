import { Test, TestingModule } from '@nestjs/testing';
import { AutoAssignDispatchRiderUseCase } from './auto-assign-dispatch-rider.use-case';
import { IBusinessOrderRepository } from '../../domain/repositories/business-order.repository.interface';
import { IBusinessDispatchRepository } from '../../domain/repositories/business-dispatch.repository.interface';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { DispatchTaskType, OrderStatus } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AutoAssignDispatchRiderUseCase', () => {
  let useCase: AutoAssignDispatchRiderUseCase;
  let orderRepo: jest.Mocked<IBusinessOrderRepository>;
  let dispatchRepo: jest.Mocked<IBusinessDispatchRepository>;
  let prismaService: any;

  beforeEach(async () => {
    orderRepo = {
      findById: jest.fn(),
    } as any;

    dispatchRepo = {} as any;

    prismaService = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      dispatchRiderProfile: {
        findMany: jest.fn(),
      },
      dispatchTask: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      orderTimeline: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoAssignDispatchRiderUseCase,
        { provide: 'IBusinessOrderRepository', useValue: orderRepo },
        { provide: 'IBusinessDispatchRepository', useValue: dispatchRepo },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    useCase = module.get<AutoAssignDispatchRiderUseCase>(
      AutoAssignDispatchRiderUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should throw NotFoundException if order does not exist', async () => {
    orderRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('biz-1', 'order-1', DispatchTaskType.Pickup),
    ).rejects.toThrow(NotFoundException);
  });

  it('should assign the closest rider based on Haversine formula', async () => {
    orderRepo.findById.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.AwaitingPickupAssignment,
    } as any);
    prismaService.dispatchTask.findFirst.mockResolvedValue(null);

    // Set target location
    prismaService.order.findUnique.mockResolvedValue({
      id: 'order-1',
      pickupAddress: { lat: 6.5244, lng: 3.3792 }, // Lagos
    });

    prismaService.dispatchRiderProfile.findMany.mockResolvedValue([
      { id: 'rider-far', currentLat: 9.0765, currentLng: 7.3986 }, // Abuja - Far
      { id: 'rider-close', currentLat: 6.524, currentLng: 3.379 }, // Lagos - Close
    ]);

    const mockTask = { id: 'task-1', riderId: 'rider-close' };
    prismaService.dispatchTask.create.mockResolvedValue(mockTask);

    const result = await useCase.execute(
      'biz-1',
      'order-1',
      DispatchTaskType.Pickup,
    );

    expect(prismaService.dispatchTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        riderId: 'rider-close',
        type: DispatchTaskType.Pickup,
        status: 'Assigned',
      }),
    });
  });

  it('should fallback to first available rider if no valid GPS data', async () => {
    orderRepo.findById.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.AwaitingPickupAssignment,
    } as any);
    prismaService.dispatchTask.findFirst.mockResolvedValue(null);

    // Set target location
    prismaService.order.findUnique.mockResolvedValue({
      id: 'order-1',
      pickupAddress: { lat: 6.5244, lng: 3.3792 },
    });

    prismaService.dispatchRiderProfile.findMany.mockResolvedValue([
      { id: 'rider-1', currentLat: null, currentLng: null },
      { id: 'rider-2', currentLat: null, currentLng: null },
    ]);

    const mockTask = { id: 'task-1', riderId: 'rider-1' };
    prismaService.dispatchTask.create.mockResolvedValue(mockTask);

    const result = await useCase.execute(
      'biz-1',
      'order-1',
      DispatchTaskType.Pickup,
    );

    expect(prismaService.dispatchTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        riderId: 'rider-1', // First available fallback
        type: DispatchTaskType.Pickup,
        status: 'Assigned',
      }),
    });
  });

  it('should throw BadRequestException if no available riders', async () => {
    orderRepo.findById.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.AwaitingPickupAssignment,
    } as any);
    prismaService.dispatchTask.findFirst.mockResolvedValue(null);
    prismaService.order.findUnique.mockResolvedValue({ id: 'order-1' });

    prismaService.dispatchRiderProfile.findMany.mockResolvedValue([]); // No riders

    await expect(
      useCase.execute('biz-1', 'order-1', DispatchTaskType.Pickup),
    ).rejects.toThrow(BadRequestException);
  });
});
