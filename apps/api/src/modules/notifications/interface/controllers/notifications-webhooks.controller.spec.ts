import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsWebhooksController } from './notifications-webhooks.controller';
import { EmailService } from '../../infrastructure/services/email.service';
import { SmsService } from '../../infrastructure/services/sms.service';

describe('NotificationsWebhooksController', () => {
  let controller: NotificationsWebhooksController;
  let emailService: EmailService;
  let smsService: SmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsWebhooksController],
      providers: [
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: SmsService,
          useValue: {
            sendSms: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationsWebhooksController>(NotificationsWebhooksController);
    emailService = module.get<EmailService>(EmailService);
    smsService = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should dispatch email notification', async () => {
    const payload = {
      type: 'email' as const,
      recipient: 'test@example.com',
      subject: 'Test',
      body: 'Hello',
    };

    await controller.handleNotification(payload);
    expect(emailService.sendEmail).toHaveBeenCalledWith(payload.recipient, payload.subject, payload.body);
  });
});
