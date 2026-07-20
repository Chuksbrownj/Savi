import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IBusinessDispatchRepository } from '../../domain/repositories/business-dispatch.repository.interface';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { DispatchTaskStatus } from '@prisma/client';

@Injectable()
export class ReassignDispatchTaskUseCase {
  constructor(
    @Inject('IBusinessDispatchRepository')
    private readonly dispatchRepository: IBusinessDispatchRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(businessId: string, taskId: string, newRiderId: string) {
    const task = await this.dispatchRepository.findTaskById(businessId, taskId);

    if (!task) {
      throw new NotFoundException('Dispatch task not found');
    }

    if (
      task.status === DispatchTaskStatus.Completed ||
      task.status === DispatchTaskStatus.Cancelled
    ) {
      throw new BadRequestException(
        `Cannot reassign task in status ${task.status}`,
      );
    }

    // Verify rider belongs to business
    const rider = await this.prisma.dispatchRiderProfile.findFirst({
      where: { id: newRiderId, businessId, user: { isActive: true } },
    });

    if (!rider) {
      throw new BadRequestException('Invalid or inactive rider');
    }

    return this.dispatchRepository.updateTask(businessId, taskId, {
      riderId: newRiderId,
      status: DispatchTaskStatus.Assigned, // reset to assigned
      assignedAt: new Date(),
    });
  }
}
