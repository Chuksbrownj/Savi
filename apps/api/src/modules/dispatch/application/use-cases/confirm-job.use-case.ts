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
  RiderAvailability,
  UserType,
} from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ConfirmJobDto } from '../../interface/dtos/confirm-job.dto';
import { OrderWorkflowService } from '../../../orders/domain/services/order-workflow.service';

@Injectable()
export class ConfirmJobUseCase {
  constructor(
    @Inject(DISPATCH_REPOSITORY)
    private readonly dispatchRepository: IDispatchRepository,
    private readonly prisma: PrismaService,
    private readonly workflowService: OrderWorkflowService,
  ) {}

  async execute(userId: string, taskId: string, dto: ConfirmJobDto) {
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

    if (job.status !== DispatchTaskStatus.InProgress) {
      throw new BadRequestException(
        `Cannot confirm job with status ${job.status}`,
      );
    }

    // Determine the new order status
    const newOrderStatus =
      job.type === DispatchTaskType.Pickup
        ? OrderStatus.LaundryReceived
        : OrderStatus.Delivered;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create POD
      await tx.proofOfDelivery.create({
        data: {
          dispatchTaskId: taskId,
          imageUrl: dto.imageUrl,
          signatureUrl: dto.signatureUrl,
          recipientName: dto.recipientName,
          notes: dto.notes,
        },
      });

      // 2. Update Job
      const updatedJob = await tx.dispatchTask.update({
        where: { id: taskId },
        data: {
          status: DispatchTaskStatus.Completed,
          completedAt: new Date(),
        },
      });

      // 3. Update Order
      const order = await tx.order.findUnique({ where: { id: job.orderId } });
      await this.workflowService.transition(
        order as any,
        newOrderStatus,
        UserType.DispatchRider,
        { notes: `Task ${job.type} completed by rider`, actorUserId: userId },
        tx,
      );

      // 4. Revert Rider Availability to Online
      await tx.dispatchRiderProfile.update({
        where: { id: profile.id },
        data: { availability: RiderAvailability.Online },
      });

      return updatedJob;
    });
  }
}
