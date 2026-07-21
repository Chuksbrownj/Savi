import { Controller, Post, Headers, Body, Req, BadRequestException } from '@nestjs/common';
import { ProcessPaymentWebhookUseCase } from '../../application/use-cases/process-payment-webhook.use-case';
import { ProcessPayoutWebhookUseCase } from '../../application/use-cases/process-payout-webhook.use-case';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '../../../identity/interface/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
@Public()
export class WebhooksController {
  constructor(
    private readonly processPaymentWebhookUseCase: ProcessPaymentWebhookUseCase,
    private readonly processPayoutWebhookUseCase: ProcessPayoutWebhookUseCase,
  ) {}

  @Post('paystack')
  @ApiExcludeEndpoint()
  async handlePaystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }

    return this.processPaymentWebhookUseCase.execute({
      provider: 'paystack',
      signature,
      payload,
    });
  }

  @Post('flutterwave')
  @ApiExcludeEndpoint()
  async handleFlutterwaveWebhook(
    @Headers('verif-hash') signature: string, // Flutterwave usually uses this header
    @Body() payload: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }

    return this.processPaymentWebhookUseCase.execute({
      provider: 'flutterwave',
      signature,
      payload,
    });
  }

  @Post('stripe')
  @ApiExcludeEndpoint()
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() payload: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }

    return this.processPaymentWebhookUseCase.execute({
      provider: 'stripe',
      signature,
      payload,
    });
  }

  @Post('payouts/paystack')
  @ApiExcludeEndpoint()
  async handlePaystackPayoutWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }

    return this.processPayoutWebhookUseCase.execute({
      provider: 'paystack',
      signature,
      payload,
    });
  }
}
