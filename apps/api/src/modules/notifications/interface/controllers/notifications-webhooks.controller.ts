import { Controller, Post, Body, Inject, Logger, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EMAIL_SENDER } from '../../application/interfaces/email-sender.interface';
import { SMS_SENDER } from '../../application/interfaces/sms-sender.interface';
import { PUSH_SENDER } from '../../application/interfaces/push-sender.interface';
import { IEmailSender } from '../../application/interfaces/email-sender.interface';
import { ISmsSender } from '../../application/interfaces/sms-sender.interface';
import { IPushSender } from '../../application/interfaces/push-sender.interface';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@ApiTags('notifications-webhooks')
@Controller('v1/notifications/webhooks')
export class NotificationsWebhooksController {
  private readonly logger = new Logger(NotificationsWebhooksController.name);

  constructor(
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    @Inject(SMS_SENDER) private readonly smsSender: ISmsSender,
    @Inject(PUSH_SENDER) private readonly pushSender: IPushSender,
    private readonly prisma: PrismaService,
  ) {}

  @Post('qstash')
  @ApiOperation({ summary: 'Process QStash notification webhooks' })
  async handleQStashWebhook(@Req() req: any, @Body() payload: any) {
    // In production, you would verify the QStash signature here using @upstash/qstash Receiver
    // const signature = req.headers['upstash-signature'];
    
    const { userId, category, channels, title, body, data } = payload;
    
    if (!userId || !channels) {
      throw new BadRequestException('Invalid payload');
    }

    this.logger.log(`Processing notification for user ${userId} via QStash`);

    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found for notification`);
      return { success: false, reason: 'User not found' };
    }

    const promises = [];

    if (channels.includes(NotificationChannel.Email) && user.email) {
      promises.push(
        this.emailSender.sendEmail(
          user.email,
          title,
          `<p>${body}</p>`
        ).catch((err: any) => this.logger.error(`Failed to send email to ${user.email}`, err))
      );
    }

    if (channels.includes(NotificationChannel.Push)) {
      // Find FCM tokens for user
      promises.push(
        this.prisma.deviceToken.findMany({ where: { userId } }).then(tokens => {
          const validTokens = tokens.map(t => t.token);
          if (validTokens.length > 0) {
            return this.pushSender.sendMulticast(validTokens, title, body, data)
              .catch((err: any) => this.logger.error(`Failed to send push to ${userId}`, err));
          }
          return Promise.resolve();
        })
      );
    }

    if (channels.includes(NotificationChannel.InApp)) {
      promises.push(
        this.prisma.notification.create({
          data: {
            userId,
            title,
            body,
            channel: NotificationChannel.InApp,
            data: data || {},
          },
        }).catch((err: any) => this.logger.error(`Failed to save in-app notification for ${userId}`, err))
      );
    }

    // Await all deliveries
    await Promise.all(promises);

    this.logger.log(`Successfully processed notification for user ${userId}`);
    return { success: true };
  }
}
