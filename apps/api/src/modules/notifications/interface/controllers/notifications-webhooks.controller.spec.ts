import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsWebhooksController } from './notifications-webhooks.controller';
import { EMAIL_SENDER } from '../../application/interfaces/email-sender.interface';
import { SMS_SENDER } from '../../application/interfaces/sms-sender.interface';
import { PUSH_SENDER } from '../../application/interfaces/push-sender.interface';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

describe('NotificationsWebhooksController', () => {
  let controller: NotificationsWebhooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsWebhooksController],
      providers: [
        {
          provide: EMAIL_SENDER,
          useValue: { sendEmail: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: SMS_SENDER,
          useValue: { sendSms: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: PUSH_SENDER,
          useValue: { sendPush: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
            deviceToken: { findMany: jest.fn() },
            notification: { create: jest.fn() },
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationsWebhooksController>(
      NotificationsWebhooksController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
