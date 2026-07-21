import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsDashboardUseCases } from './analytics-dashboard.use-cases';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

describe('AnalyticsDashboardUseCases', () => {
  let useCases: AnalyticsDashboardUseCases;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsDashboardUseCases,
        {
          provide: PrismaService,
          useValue: {
            order: {
              count: jest.fn(),
              aggregate: jest.fn(),
              findMany: jest.fn(),
            },
            orderItem: {
              findMany: jest.fn(),
            },
            dispatchRiderProfile: {
              findMany: jest.fn(),
            },
            branch: {
              findMany: jest.fn(),
            },
            customerProfile: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    useCases = module.get<AnalyticsDashboardUseCases>(AnalyticsDashboardUseCases);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(useCases).toBeDefined();
  });

  describe('getDashboardSummary', () => {
    it('should aggregate orders correctly for a given period', async () => {
      // Mocking Prisma counts
      jest.spyOn(prismaService.order, 'count').mockResolvedValueOnce(100); // totalOrders
      jest.spyOn(prismaService.order, 'count').mockResolvedValueOnce(10);  // activeOrders
      jest.spyOn(prismaService.order, 'count').mockResolvedValueOnce(5);   // cancelledOrders
      jest.spyOn(prismaService.order, 'count').mockResolvedValueOnce(85);  // completedOrders

      // Mocking Prisma aggregate
      jest.spyOn(prismaService.order, 'aggregate').mockResolvedValueOnce({
        _sum: { total: 5000 as any },
        _avg: { total: 50 as any },
      } as any);

      const result = await useCases.getDashboardSummary('b-123', 'today');

      expect(result).toEqual({
        totalOrders: 100,
        activeOrders: 10,
        revenue: 5000,
        averageOrderValue: 50,
        completionRate: 85,
        cancellationRate: 5,
      });

      expect(prismaService.order.count).toHaveBeenCalledTimes(4);
      expect(prismaService.order.aggregate).toHaveBeenCalledTimes(1);
    });
  });

  describe('getOrdersTrend', () => {
    it('should return trend data', async () => {
      jest.spyOn(prismaService.order, 'findMany').mockResolvedValueOnce([
        { createdAt: new Date('2023-10-01T10:00:00Z'), total: 100 as any },
        { createdAt: new Date('2023-10-01T14:00:00Z'), total: 150 as any },
        { createdAt: new Date('2023-10-02T10:00:00Z'), total: 200 as any },
      ] as any[]);

      const result = await useCases.getOrdersTrend('b-123', 'day');

      expect(result).toEqual([
        { date: '2023-10-01', count: 2, revenue: 250 },
        { date: '2023-10-02', count: 1, revenue: 200 },
      ]);
    });
  });
});
