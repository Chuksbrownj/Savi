import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<HealthCheckService>;

  beforeEach(async () => {
    const mockHealthService = {
      check: jest.fn().mockResolvedValue({
        status: 'ok',
        info: { database: { status: 'up' } },
        details: { database: { status: 'up' } },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthService },
        { provide: PrismaHealthIndicator, useValue: { pingCheck: jest.fn() } },
        { provide: MemoryHealthIndicator, useValue: { checkHeap: jest.fn(), checkRSS: jest.fn() } },
        { provide: DiskHealthIndicator, useValue: { checkStorage: jest.fn() } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('check() should call health.check()', async () => {
    const result = await controller.check();
    expect(healthService.check).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('ok');
  });

  it('metrics() should return stub response', () => {
    const result = controller.metrics();
    expect(result).toHaveProperty('status', 'ok');
    expect(result).toHaveProperty('message');
  });
});
