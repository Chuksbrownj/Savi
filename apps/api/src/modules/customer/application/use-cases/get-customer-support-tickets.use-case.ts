import { Inject, Injectable } from '@nestjs/common';
import {
  SUPPORT_TICKET_REPOSITORY,
  ISupportTicketRepository,
} from '../../domain/repositories/support-ticket.repository.interface';
import { SupportTicket } from '@prisma/client';

@Injectable()
export class GetCustomerSupportTicketsUseCase {
  constructor(
    @Inject(SUPPORT_TICKET_REPOSITORY)
    private readonly ticketRepo: ISupportTicketRepository,
  ) {}

  async execute(userId: string): Promise<SupportTicket[]> {
    return this.ticketRepo.findByUserId(userId);
  }
}
