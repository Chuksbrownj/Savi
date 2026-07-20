import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DISPATCH_REPOSITORY,
  IDispatchRepository,
} from '../../domain/repositories/dispatch.repository.interface';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class ReportIssueUseCase {
  constructor(
    @Inject(DISPATCH_REPOSITORY)
    private readonly dispatchRepository: IDispatchRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, taskId: string, description: string) {
    const profile =
      await this.dispatchRepository.getRiderProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Dispatch rider profile not found');
    }

    const job = await this.dispatchRepository.getJobById(profile.id, taskId);
    if (!job) {
      throw new NotFoundException(
        'Job not found or not assigned to this rider',
      );
    }

    // Creates an OrderTimeline record with the current order status, just logging the issue.
    // In a full implementation, this might also create a SupportTicket or notify the business via websockets.
    return this.prisma.orderTimeline.create({
      data: {
        orderId: job.orderId,
        status: job.order.status,
        notes: `ISSUE REPORTED BY RIDER (Task ${job.id}): ${description}`,
      } as any,
    });
  }
}
