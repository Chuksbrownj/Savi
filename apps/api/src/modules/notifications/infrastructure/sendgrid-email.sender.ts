import { Injectable, Logger } from '@nestjs/common';
import { IEmailSender } from '../application/interfaces/email-sender.interface';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridEmailSender implements IEmailSender {
  private readonly logger = new Logger(SendGridEmailSender.name);

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      this.logger.warn('SENDGRID_API_KEY not set. Emails will not be sent.');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!process.env.SENDGRID_API_KEY) {
      this.logger.debug(`[STUB] Sending email to ${to}: ${subject}`);
      return;
    }

    try {
      await sgMail.send({
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@saviapp.com',
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }
}
