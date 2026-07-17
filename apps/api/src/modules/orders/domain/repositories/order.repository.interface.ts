import { Order, OrderItem, OrderStatus, OrderTimeline } from '@prisma/client';

export type OrderWithDetails = Order & {
  items: OrderItem[];
  timeline: OrderTimeline[];
};

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface IOrderRepository {
  create(data: any): Promise<OrderWithDetails>;
  findById(id: string): Promise<OrderWithDetails | null>;
  findByCustomerId(customerId: string): Promise<OrderWithDetails[]>;
  update(id: string, data: Partial<Order>): Promise<OrderWithDetails>;
  addTimelineEvent(
    orderId: string,
    status: OrderStatus,
    notes?: string,
  ): Promise<void>;
  updateItems(orderId: string, items: any[]): Promise<OrderWithDetails>;
}
