import { Injectable, Logger } from '@nestjs/common';
import { IOtpSender } from './otp-sender.interface';

/**
 * ConsolOtpSender — dev/test stub.
 * Logs OTP codes to the console instead of sending real SMS or emails.
 * In production, swap this binding for a real provider (Brevo, Termii, etc.)
 * in the IdentityModule providers array.
 *
 * IMPORTANT: OTP codes are NEVER logged in production.
 * This service is only bound when NODE_ENV !== 'production'.
 */
@Injectable()
export class ConsoleOtpSender implements IOtpSender {
  private readonly logger = new Logger('OTP');

  async send(to: string, message: string): Promise<void> {
    this.logger.warn(`[DEV ONLY] OTP for ${to.slice(0, 4)}***: ${message}`);
  }
}
