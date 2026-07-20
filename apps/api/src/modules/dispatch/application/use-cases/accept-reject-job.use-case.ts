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
import { DispatchTaskStatus, RiderAvailability } from '@prisma/client';

@Injectable()
export class AcceptRejectJobUseCase {
  constructor(
    @Inject(DISPATCH_REPOSITORY)
    private readonly dispatchRepository: IDispatchRepository,
  ) {}

  async accept(userId: string, taskId: string) {
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

    if (job.status !== DispatchTaskStatus.Assigned) {
      throw new BadRequestException(
        `Cannot accept job with status ${job.status}`,
      );
    }

    const updatedJob = await this.dispatchRepository.updateJobStatus(
      taskId,
      DispatchTaskStatus.Accepted,
    );
    await this.dispatchRepository.updateRiderAvailability(
      profile.id,
      RiderAvailability.OnJob,
    );

    return updatedJob;
  }

  async reject(userId: string, taskId: string, reason: string) {
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

    if (job.status !== DispatchTaskStatus.Assigned) {
      throw new BadRequestException(
        `Cannot reject job with status ${job.status}`,
      );
    }

    return this.dispatchRepository.updateJobStatus(
      taskId,
      DispatchTaskStatus.Rejected,
      reason,
    );
  }
}
