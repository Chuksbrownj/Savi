import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IDispatchRepository } from '../../domain/repositories/dispatch.repository.interface';
import {
  DispatchRiderProfile,
  DispatchTask,
  ProofOfDelivery,
  Settlement,
  RiderAvailability,
  DispatchTaskStatus,
} from '@prisma/client';

@Injectable()
export class PrismaDispatchRepository implements IDispatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getRiderProfileByUserId(
    userId: string,
  ): Promise<DispatchRiderProfile | null> {
    return this.prisma.dispatchRiderProfile.findUnique({
      where: { userId },
    });
  }

  async updateRiderAvailability(
    riderId: string,
    availability: RiderAvailability,
  ): Promise<DispatchRiderProfile> {
    return this.prisma.dispatchRiderProfile.update({
      where: { id: riderId },
      data: { availability },
    });
  }

  async updateRiderLocation(
    riderId: string,
    lat: number,
    lng: number,
  ): Promise<DispatchRiderProfile> {
    return this.prisma.dispatchRiderProfile.update({
      where: { id: riderId },
      data: { currentLat: lat, currentLng: lng },
    });
  }

  async getAssignedJobs(
    riderId: string,
    status?: DispatchTaskStatus[],
  ): Promise<(DispatchTask & { order: any })[]> {
    const whereClause: any = { riderId };
    if (status && status.length > 0) {
      whereClause.status = { in: status };
    }

    return this.prisma.dispatchTask.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            pickupAddress: true,
            deliveryAddress: true,
            customer: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobById(
    riderId: string,
    taskId: string,
  ): Promise<(DispatchTask & { order: any }) | null> {
    return this.prisma.dispatchTask.findFirst({
      where: { id: taskId, riderId },
      include: {
        order: {
          include: {
            pickupAddress: true,
            deliveryAddress: true,
            customer: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateJobStatus(
    taskId: string,
    status: DispatchTaskStatus,
    notes?: string,
  ): Promise<DispatchTask> {
    const data: any = { status };
    if (status === DispatchTaskStatus.Accepted) data.acceptedAt = new Date();
    if (status === DispatchTaskStatus.Completed) data.completedAt = new Date();

    return this.prisma.dispatchTask.update({
      where: { id: taskId },
      data,
    });
  }

  async createProofOfDelivery(
    data: Omit<
      ProofOfDelivery,
      'id' | 'createdAt' | 'updatedAt' | 'capturedAt'
    >,
  ): Promise<ProofOfDelivery> {
    return this.prisma.proofOfDelivery.create({
      data,
    });
  }

  async getEarnings(
    riderId: string,
  ): Promise<{ settlements: Settlement[]; pendingTasks: DispatchTask[] }> {
    const settlements = await this.prisma.settlement.findMany({
      where: { riderId },
      orderBy: { periodStart: 'desc' },
    });

    const pendingTasks = await this.prisma.dispatchTask.findMany({
      where: {
        riderId,
        status: DispatchTaskStatus.Completed,
      },
      orderBy: { completedAt: 'desc' },
      take: 50,
    });

    return { settlements, pendingTasks };
  }
}
