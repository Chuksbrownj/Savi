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
  UserType,
} from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { OrderWorkflowService } from '../../../orders/domain/services/order-workflow.service';

@Injectable()
export class StartJobUseCase {
  constructor(
    @Inject(DISPATCH_REPOSITORY)
    private readonly dispatchRepository: IDispatchRepository,
    private readonly prisma: PrismaService,
    private readonly workflowService: OrderWorkflowService,
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

      const order = await tx.order.findUnique({ where: { id: job.orderId } });
      await this.workflowService.transition(
        order as any,
        newOrderStatus,
        UserType.DispatchRider,
        { notes: `Task ${job.type} started by rider`, actorUserId: userId },
        tx,
      );

      return updatedJob;
    });
  }
}
