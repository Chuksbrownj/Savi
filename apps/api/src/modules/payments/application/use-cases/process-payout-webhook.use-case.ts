import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { GatewayFactory } from '../../infrastructure/gateways/gateway-factory';
import { SettlementStatus } from '@prisma/client';

export interface ProcessPayoutWebhookCommand {
  provider: string;
  signature: string;
  payload: any;
}

@Injectable()
export class ProcessPayoutWebhookUseCase {
  private readonly logger = new Logger(ProcessPayoutWebhookUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: GatewayFactory,
  ) {}

  async execute(command: ProcessPayoutWebhookCommand) {
    const { provider, signature, payload } = command;

    const gateway = this.gatewayFactory.getPaymentGateway(provider);

    // Reusing the payment gateway's signature verification since they use the same keys usually
    const isValidSignature = gateway.verifyWebhookSignature(payload, signature);
    if (!isValidSignature) {
      this.logger.error(`Invalid payout webhook signature for provider: ${provider}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    let reference: string;
    let isSuccess: boolean;
    let isFailed: boolean;

    if (provider.toLowerCase() === 'paystack') {
      reference = payload.data.reference;
      isSuccess = payload.event === 'transfer.success';
      isFailed = payload.event === 'transfer.failed' || payload.event === 'transfer.reversed';
    } else {
      // Simplified for now, just checking paystack as example
      reference = payload.data?.reference || payload.data?.tx_ref;
      isSuccess = payload.event?.includes('success');
      isFailed = payload.event?.includes('fail');
    }

    if (!reference) {
      throw new BadRequestException('No reference found in payload');
    }

    if (!isSuccess && !isFailed) {
      // Not a terminal state event, ignore
      return { message: 'Event ignored' };
    }

    return await this.prisma.$transaction(async (tx: any) => {
      const settlement = await tx.settlement.findFirst({
        where: { reference },
      });

      if (!settlement) {
        this.logger.warn(`Settlement with reference ${reference} not found`);
        return { message: 'Settlement not found, ignored' };
      }

      if (settlement.status === SettlementStatus.Paid || settlement.status === SettlementStatus.Failed) {
        return { message: 'Webhook already processed for this settlement' };
      }

      const newStatus = isSuccess ? SettlementStatus.Paid : SettlementStatus.Failed;

      await tx.settlement.update({
        where: { id: settlement.id },
        data: {
          status: newStatus,
          paidAt: isSuccess ? new Date() : null,
        },
      });

      return { message: 'Payout webhook processed successfully' };
    });
  }
}
