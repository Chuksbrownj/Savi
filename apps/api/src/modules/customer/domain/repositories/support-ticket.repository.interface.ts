import { SupportTicket, TicketStatus } from '@prisma/client';

export const SUPPORT_TICKET_REPOSITORY = Symbol('SUPPORT_TICKET_REPOSITORY');

export interface ISupportTicketRepository {
  create(
    data: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'resolvedAt'>,
  ): Promise<SupportTicket>;
  findByUserId(userId: string): Promise<SupportTicket[]>;
  findByIdAndUserId(id: string, userId: string): Promise<SupportTicket | null>;
}
