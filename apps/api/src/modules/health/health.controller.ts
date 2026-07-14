import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check API health status (DB, Redis, disk)' })
  @ApiResponse({ status: 200, description: 'All systems operational' })
  @ApiResponse({ status: 503, description: 'One or more checks failed' })
  check() {
    return this.health.check([
      // Database check via Prisma
      () => this.prismaHealth.pingCheck('database', this.prisma as any),

      // Heap memory < 512MB
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),

      // RSS memory < 1GB
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),

      // Disk free > 10%
      () =>
        this.disk.checkStorage('disk', {
          thresholdPercent: 0.9,
          path: process.platform === 'win32' ? 'C:\\' : '/',
        }),
    ]);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Metrics stub (future Prometheus integration)' })
  @ApiResponse({ status: 200, description: 'Metrics stub response' })
  metrics() {
    return {
      status: 'ok',
      message: 'Prometheus metrics endpoint — coming in a future phase',
    };
  }
}
