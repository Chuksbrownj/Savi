import { Module, forwardRef } from '@nestjs/common';

import { EMAIL_SENDER } from './application/interfaces/email-sender.interface';
import { SMS_SENDER } from './application/interfaces/sms-sender.interface';
import { PUSH_SENDER } from './application/interfaces/push-sender.interface';
import { SendGridEmailSender } from './infrastructure/sendgrid-email.sender';
import { TwilioSmsSender } from './infrastructure/twilio-sms.sender';
import { FcmPushSender } from './infrastructure/fcm-push.sender';
import { NotificationEventSubscriber } from './application/events/notification-event.subscriber';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { NotificationsController } from './interface/controllers/notifications.controller';
import { NotificationsWebhooksController } from './interface/controllers/notifications-webhooks.controller';
import { NotificationsGateway } from './interface/gateways/notifications.gateway';
import { IdentityModule } from '../identity/identity.module'; // Required for JwtService if exported

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => IdentityModule),
  ],
  controllers: [
    NotificationsController,
    NotificationsWebhooksController
  ],
  providers: [
    {
      provide: EMAIL_SENDER,
      useClass: SendGridEmailSender,
    },
    {
      provide: SMS_SENDER,
      useClass: TwilioSmsSender,
    },
    {
      provide: PUSH_SENDER,
      useClass: FcmPushSender,
    },
    NotificationEventSubscriber,
    NotificationsGateway,
  ],
  exports: [
    EMAIL_SENDER,
    SMS_SENDER,
    PUSH_SENDER,
  ],
})
export class NotificationsModule {}
