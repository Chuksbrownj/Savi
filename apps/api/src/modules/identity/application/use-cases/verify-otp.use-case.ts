import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { OtpVerifyDto } from '../dtos/auth.dto';
import { RedisOtpStore } from '../../infrastructure/otp/redis-otp.store';

@Injectable()
export class VerifyOtpUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly otpStore: RedisOtpStore,
  ) {}

  async execute(dto: OtpVerifyDto): Promise<{ message: string }> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('email or phone is required');
    }

    const identifier = dto.email ?? dto.phone!;

    const valid = await this.otpStore.verify(identifier, dto.code);
    if (!valid) {
      throw new BadRequestException('OTP is invalid or expired');
    }

    // Consume the OTP so it cannot be reused
    await this.otpStore.delete(identifier);

    // Mark the user verified
    const user = dto.email
      ? await this.users.findByEmail(dto.email)
      : await this.users.findByPhone(dto.phone!);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (dto.email) {
      await this.users.update(user.id, { isEmailVerified: true });
    } else {
      await this.users.update(user.id, { isPhoneVerified: true });
    }

    return { message: 'Verification successful' };
  }
}
