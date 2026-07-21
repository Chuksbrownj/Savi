import { Inject, Injectable, Logger } from '@nestjs/common';
import { IOtpSender } from './otp-sender.interface';
import { EMAIL_SENDER, IEmailSender } from '../../../notifications/application/interfaces/email-sender.interface';
import { ISmsSender, SMS_SENDER } from '../../../notifications/application/interfaces/sms-sender.interface';

@Injectable()
export class RealOtpSender implements IOtpSender {
  private readonly logger = new Logger(RealOtpSender.name);

  constructor(
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    @Inject(SMS_SENDER) private readonly smsSender: ISmsSender,
  ) {}

  async send(to: string, message: string): Promise<void> {
    const isEmail = to.includes('@');

    try {
      if (isEmail) {
        await this.emailSender.sendEmail(
          to,
          'Your Savi Verification Code',
          `<html><body><p>${message}</p></body></html>`
        );
      } else {
        await this.smsSender.sendSms(to, message);
      }
      this.logger.log(`OTP sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${to}`, error);
      throw error;
    }
  }
}
