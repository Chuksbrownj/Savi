import { Injectable } from '@nestjs/common';
import {
  DispatchTask,
  DispatchTaskType,
  DispatchTaskStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IBusinessDispatchRepository } from '../../domain/repositories/business-dispatch.repository.interface';

@Injectable()
export class PrismaBusinessDispatchRepository
  implements IBusinessDispatchRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async createTask(data: {
    orderId: string;
    businessId: string;
    type: DispatchTaskType;
    riderId: string;
  }): Promise<DispatchTask> {
    return this.prisma.dispatchTask.create({
      data: {
        orderId: data.orderId,
        businessId: data.businessId,
        type: data.type,
        riderId: data.riderId,
        status: DispatchTaskStatus.Assigned,
        assignedAt: new Date(),
      },
    });
  }

  async findTaskById(
    businessId: string,
    taskId: string,
  ): Promise<DispatchTask | null> {
    return this.prisma.dispatchTask.findFirst({
      where: { id: taskId, businessId },
    });
  }

  async updateTask(
    businessId: string,
    taskId: string,
    data: Partial<DispatchTask>,
  ): Promise<DispatchTask> {
    return this.prisma.dispatchTask.update({
      where: { id: taskId, businessId },
      data,
    });
  }
}
