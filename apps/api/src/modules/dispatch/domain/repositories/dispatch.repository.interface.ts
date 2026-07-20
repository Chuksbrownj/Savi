import {
  DispatchRiderProfile,
  DispatchTask,
  ProofOfDelivery,
  Settlement,
  RiderAvailability,
  DispatchTaskStatus,
} from '@prisma/client';

export const DISPATCH_REPOSITORY = 'DISPATCH_REPOSITORY';

export interface IDispatchRepository {
  getRiderProfileByUserId(userId: string): Promise<DispatchRiderProfile | null>;
  updateRiderAvailability(
    riderId: string,
    availability: RiderAvailability,
  ): Promise<DispatchRiderProfile>;
  updateRiderLocation(
    riderId: string,
    lat: number,
    lng: number,
  ): Promise<DispatchRiderProfile>;

  getAssignedJobs(
    riderId: string,
    status?: DispatchTaskStatus[],
  ): Promise<(DispatchTask & { order: any })[]>;
  getJobById(
    riderId: string,
    taskId: string,
  ): Promise<(DispatchTask & { order: any }) | null>;

  updateJobStatus(
    taskId: string,
    status: DispatchTaskStatus,
    notes?: string,
  ): Promise<DispatchTask>;

  createProofOfDelivery(
    data: Omit<
      ProofOfDelivery,
      'id' | 'createdAt' | 'updatedAt' | 'capturedAt'
    >,
  ): Promise<ProofOfDelivery>;

  getEarnings(riderId: string): Promise<{
    settlements: Settlement[];
    pendingTasks: DispatchTask[];
  }>;
}
