import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { ForgotPasswordDto } from '../dtos/auth.dto';
import { RedisOtpStore } from '../../infrastructure/otp/redis-otp.store';
import {
  IOtpSender,
  OTP_SENDER,
} from '../../infrastructure/otp/otp-sender.interface';

const RESET_PREFIX = 'pwd_reset:';
const RESET_TTL_SECONDS = 900; // 15 minutes

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly otpStore: RedisOtpStore,
    @Inject(OTP_SENDER) private readonly otpSender: IOtpSender,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<{ message: string }> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('email or phone is required');
    }

    const identifier = dto.email ?? dto.phone!;
    const user = dto.email
      ? await this.users.findByEmail(dto.email)
      : await this.users.findByPhone(dto.phone!);

    // Always return the same message to prevent user enumeration
    if (!user) {
      return { message: 'If your account exists, a reset link has been sent.' };
    }

    // Generate a random reset token
    const token = crypto.randomBytes(32).toString('hex');

    // Store token (hashed) in Redis with 15 min TTL
    await this.otpStore.set(
      `${RESET_PREFIX}${identifier}`,
      token,
      RESET_TTL_SECONDS,
    );

    // Send via stub (in dev, logs to console)
    await this.otpSender.send(
      identifier,
      `Your password reset token: ${token}`,
    );

    return { message: 'If your account exists, a reset link has been sent.' };
  }
}
