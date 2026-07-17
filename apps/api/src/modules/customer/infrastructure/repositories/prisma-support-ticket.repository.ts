import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { SupportTicket } from '@prisma/client';
import { ISupportTicketRepository } from '../../domain/repositories/support-ticket.repository.interface';

@Injectable()
export class PrismaSupportTicketRepository implements ISupportTicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'resolvedAt'>,
  ): Promise<SupportTicket> {
    return this.prisma.supportTicket.create({ data });
  }

  async findByUserId(userId: string): Promise<SupportTicket[]> {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<SupportTicket | null> {
    return this.prisma.supportTicket.findFirst({
      where: { id, userId },
    });
  }
}
