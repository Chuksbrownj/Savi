import {
  Order,
  OrderStatus,
  OrderItem,
  Payment,
  DispatchTask,
  Rating,
  SupportTicket,
  OrderTimeline,
} from '@prisma/client';

export interface BusinessOrderDetails extends Order {
  customer: {
    id: string;
    user: {
      fullName: string | null;
      email: string | null;
      phone: string | null;
    };
  };
  items: OrderItem[];
  payments: Payment[];
  dispatchTasks: DispatchTask[];
  ratings: Rating[];
  supportTickets: SupportTicket[];
  timeline: OrderTimeline[];
}

export interface IBusinessOrderRepository {
  findOrders(
    businessId: string,
    params: {
      skip?: number;
      take?: number;
      status?: OrderStatus;
      branchId?: string;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ data: Order[]; total: number }>;

  findById(
    businessId: string,
    orderId: string,
  ): Promise<BusinessOrderDetails | null>;

  updateStatus(
    businessId: string,
    orderId: string,
    status: OrderStatus,
  ): Promise<Order>;
}
