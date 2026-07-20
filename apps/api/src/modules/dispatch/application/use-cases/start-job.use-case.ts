import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  DISPATCH_REPOSITORY,
  IDispatchRepository,
} from '../../domain/repositories/dispatch.repository.interface';
import {
  DispatchTaskStatus,
  DispatchTaskType,
  OrderStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class StartJobUseCase {
  constructor(
    @Inject(DISPATCH_REPOSITORY)
    private readonly dispatchRepository: IDispatchRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, taskId: string) {
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

    if (job.status !== DispatchTaskStatus.Accepted) {
      throw new BadRequestException(
        `Cannot start job with status ${job.status}`,
      );
    }

    // Determine the new order status
    const newOrderStatus =
      job.type === DispatchTaskType.Pickup
        ? OrderStatus.PickupInProgress
        : OrderStatus.OutForDelivery;

    // Use transaction to update both job and order status
    return this.prisma.$transaction(async (tx) => {
      const updatedJob = await tx.dispatchTask.update({
        where: { id: taskId },
        data: { status: DispatchTaskStatus.InProgress },
      });

      await tx.order.update({
        where: { id: job.orderId },
        data: { status: newOrderStatus },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: job.orderId,
          status: newOrderStatus,
          notes: `Task ${job.type} started by rider`,
        } as any,
      });

      return updatedJob;
    });
  }
}
