import { Injectable, Logger } from '@nestjs/common';
import { IPushSender } from '../application/interfaces/push-sender.interface';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class FcmPushSender implements IPushSender {
  private readonly logger = new Logger(FcmPushSender.name);

  constructor() {
    if (!getApps().length) {
      try {
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (serviceAccountPath) {
          initializeApp({
            credential: cert(serviceAccountPath),
          });
        } else {
          this.logger.warn('GOOGLE_APPLICATION_CREDENTIALS not set. Falling back to default app initialization, or push will be stubbed.');
          initializeApp();
        }
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin', error);
      }
    }
  }

  async sendPush(token: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (!getApps().length) {
      this.logger.debug(`[STUB] Sending Push to ${token}: ${title} - ${body}`);
      return;
    }

    try {
      await getMessaging().send({
        token,
        notification: {
          title,
          body,
        },
        data,
      });
      this.logger.log(`Push sent successfully to ${token}`);
    } catch (error) {
      this.logger.error(`Failed to send push to ${token}`, error);
    }
  }

  async sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (!tokens.length) return;

    if (!getApps().length) {
      this.logger.debug(`[STUB] Sending Multicast Push to ${tokens.length} devices: ${title} - ${body}`);
      return;
    }

    try {
      const response = await getMessaging().sendEachForMulticast({
        tokens,
        notification: {
          title,
          body,
        },
        data,
      });
      this.logger.log(`Multicast push sent successfully to ${response.successCount} devices, ${response.failureCount} failed.`);
    } catch (error) {
      this.logger.error('Failed to send multicast push', error);
    }
  }
}
