import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { hashRefreshToken } from './token.helper';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
  ) {}

  async execute(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);

    if (!stored || stored.revokedAt) {
      throw new UnauthorizedException(
        'Refresh token is invalid or already revoked',
      );
    }

    await this.refreshTokens.revoke(stored.id);
  }
}
