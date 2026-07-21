import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { GatewayFactory } from '../../infrastructure/gateways/gateway-factory';
import { SettlementStatus } from '@prisma/client';

export interface ProcessSettlementCommand {
  settlementId: string;
  businessId: string;
  provider?: string;
}

@Injectable()
export class ProcessSettlementUseCase {
  private readonly logger = new Logger(ProcessSettlementUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: GatewayFactory,
  ) {}

  async execute(command: ProcessSettlementCommand) {
    const { settlementId, businessId, provider = 'paystack' } = command;

    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        rider: {
          include: { user: true },
        },
      },
    });

    if (!settlement) {
      throw new NotFoundException('Settlement not found');
    }

    if (settlement.businessId !== businessId) {
      throw new BadRequestException('Settlement does not belong to this business');
    }

    if (settlement.status !== SettlementStatus.Pending && settlement.status !== SettlementStatus.Failed) {
      throw new BadRequestException(`Cannot process settlement in status: ${settlement.status}`);
    }

    // Mark as processing
    await this.prisma.settlement.update({
      where: { id: settlementId },
      data: { status: SettlementStatus.Processing },
    });

    const payoutGateway = this.gatewayFactory.getPayoutGateway(provider);

    try {
      // In a real app, rider profile would have banking details or a provider recipient ID.
      // We will mock recipient ID with rider.id for now.
      const recipientId = settlement.rider.id;

      // Note: Usually currency comes from fee config or business settings. 
      // Using a default of NGN since we're defaulting to Paystack in this mock logic.
      const currency = 'NGN'; 

      const payoutResult = await payoutGateway.payout(
        Number(settlement.totalAmount),
        currency,
        recipientId,
        `Settlement for ${settlement.periodStart.toISOString()} - ${settlement.periodEnd.toISOString()}`
      );

      // We wait for the webhook to mark it Paid, but we can store the reference
      await this.prisma.settlement.update({
        where: { id: settlementId },
        data: { reference: payoutResult.reference },
      });

      return {
        message: 'Settlement processing initiated',
        reference: payoutResult.reference,
      };
    } catch (error) {
      this.logger.error(`Payout failed for settlement ${settlementId}`, error);
      
      await this.prisma.settlement.update({
        where: { id: settlementId },
        data: { status: SettlementStatus.Failed },
      });

      throw new BadRequestException(`Payout initiation failed: ${(error as Error).message}`);
    }
  }
}
