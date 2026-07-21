import { Injectable, Logger } from '@nestjs/common';
import { ISmsSender } from '../application/interfaces/sms-sender.interface';
import twilio from 'twilio';

@Injectable()
export class TwilioSmsSender implements ISmsSender {
  private readonly logger = new Logger(TwilioSmsSender.name);
  private client: twilio.Twilio | null = null;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      this.client = new twilio.Twilio(accountSid, authToken);
    } else {
      this.logger.warn('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set. SMS will not be sent.');
    }
  }

  async sendSms(to: string, message: string): Promise<void> {
    if (!this.client) {
      this.logger.debug(`[STUB] Sending SMS to ${to}: ${message}`);
      return;
    }

    try {
      await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_FROM_NUMBER,
        to,
      });
      this.logger.log(`SMS sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}`, error);
      throw error;
    }
  }
}
