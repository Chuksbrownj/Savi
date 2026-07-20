import {
  DispatchTask,
  DispatchTaskStatus,
  DispatchTaskType,
  Order,
  OrderStatus,
} from '@prisma/client';

export interface IBusinessDispatchRepository {
  createTask(data: {
    orderId: string;
    businessId: string;
    type: DispatchTaskType;
    riderId: string;
  }): Promise<DispatchTask>;
  findTaskById(
    businessId: string,
    taskId: string,
  ): Promise<DispatchTask | null>;
  updateTask(
    businessId: string,
    taskId: string,
    data: Partial<DispatchTask>,
  ): Promise<DispatchTask>;
}
