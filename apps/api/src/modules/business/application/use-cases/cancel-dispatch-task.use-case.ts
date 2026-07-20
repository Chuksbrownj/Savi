import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IBusinessDispatchRepository } from '../../domain/repositories/business-dispatch.repository.interface';
import { DispatchTaskStatus } from '@prisma/client';

@Injectable()
export class CancelDispatchTaskUseCase {
  constructor(
    @Inject('IBusinessDispatchRepository')
    private readonly dispatchRepository: IBusinessDispatchRepository,
  ) {}

  async execute(businessId: string, taskId: string) {
    const task = await this.dispatchRepository.findTaskById(businessId, taskId);

    if (!task) {
      throw new NotFoundException('Dispatch task not found');
    }

    if (
      task.status === DispatchTaskStatus.Completed ||
      task.status === DispatchTaskStatus.Cancelled
    ) {
      throw new BadRequestException(
        `Cannot cancel task in status ${task.status}`,
      );
    }

    return this.dispatchRepository.updateTask(businessId, taskId, {
      status: DispatchTaskStatus.Cancelled,
    });
  }
}
