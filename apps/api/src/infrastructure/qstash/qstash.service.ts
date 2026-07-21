import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@upstash/qstash';

@Injectable()
export class QStashService {
  private readonly client: Client;
  private readonly logger = new Logger(QStashService.name);
  private readonly appUrl: string;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('QSTASH_TOKEN') || '';
    if (!token) {
      this.logger.warn('QSTASH_TOKEN is missing. Background jobs will fail.');
    }
    this.client = new Client({ token });
    // Default to localhost:3000 for local dev if APP_URL is not set
    this.appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
  }

  async publishWebhook(endpointPath: string, payload: any) {
    const url = `${this.appUrl}${endpointPath}`;
    try {
      const result = await this.client.publishJSON({
        url,
        body: payload,
      });
      this.logger.debug(`Published to QStash: ${url} (MessageId: ${result.messageId})`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to publish to QStash: ${url}`, error);
      throw error;
    }
  }
}
