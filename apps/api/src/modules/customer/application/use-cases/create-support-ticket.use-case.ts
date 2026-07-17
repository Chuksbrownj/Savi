import { Inject, Injectable } from '@nestjs/common';
import {
  SUPPORT_TICKET_REPOSITORY,
  ISupportTicketRepository,
} from '../../domain/repositories/support-ticket.repository.interface';
import { CreateSupportTicketDto } from '../dtos/support-ticket.dto';
import { SupportTicket, TicketStatus } from '@prisma/client';

@Injectable()
export class CreateSupportTicketUseCase {
  constructor(
    @Inject(SUPPORT_TICKET_REPOSITORY)
    private readonly ticketRepo: ISupportTicketRepository,
  ) {}

  async execute(
    userId: string,
    dto: CreateSupportTicketDto,
  ): Promise<SupportTicket> {
    return this.ticketRepo.create({
      userId,
      subject: dto.subject,
      description: dto.description,
      status: TicketStatus.Open,
      orderId: dto.orderId || null,
      assignedStaffId: null,
    });
  }
}
