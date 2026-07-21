import { Test, TestingModule } from '@nestjs/testing';
import { PaystackGateway } from './paystack.gateway';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

describe('PaystackGateway', () => {
  let gateway: PaystackGateway;
  const mockSecretKey = 'sk_test_mock_secret';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaystackGateway,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'paystack.secretKey') return mockSecretKey;
              return null;
            }),
          },
        },
      ],
    }).compile();

    gateway = module.get<PaystackGateway>(PaystackGateway);
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for a valid signature', () => {
      const payload = { event: 'charge.success', data: { reference: 'ref_123' } };
      
      const signature = crypto
        .createHmac('sha512', mockSecretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      const result = gateway.verifyWebhookSignature(payload, signature);
      expect(result).toBe(true);
    });

    it('should return false for an invalid signature', () => {
      const payload = { event: 'charge.success', data: { reference: 'ref_123' } };
      
      const signature = crypto
        .createHmac('sha512', 'wrong_secret')
        .update(JSON.stringify(payload))
        .digest('hex');

      const result = gateway.verifyWebhookSignature(payload, signature);
      expect(result).toBe(false);
    });
  });
});
