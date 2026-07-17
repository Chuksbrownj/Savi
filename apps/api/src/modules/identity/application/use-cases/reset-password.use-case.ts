import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { Password } from '../../domain/value-objects/password.value-object';
import { ResetPasswordDto } from '../dtos/auth.dto';
import { RedisOtpStore } from '../../infrastructure/otp/redis-otp.store';

const RESET_PREFIX = 'pwd_reset:';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly otpStore: RedisOtpStore,
  ) {}

  async execute(
    dto: ResetPasswordDto,
    identifier: string,
  ): Promise<{ message: string }> {
    const key = `${RESET_PREFIX}${identifier}`;
    const valid = await this.otpStore.verify(key, dto.token);

    if (!valid) {
      throw new BadRequestException('Reset token is invalid or expired');
    }

    await this.otpStore.delete(key);

    const user = identifier.includes('@')
      ? await this.users.findByEmail(identifier)
      : await this.users.findByPhone(identifier);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const passwordObj = await Password.create(dto.newPassword);
    await this.users.update(user.id, { passwordHash: passwordObj.hash });

    // Revoke all existing sessions
    await this.refreshTokens.revokeAll(user.id);

    return { message: 'Password reset successful. Please log in again.' };
  }
}
