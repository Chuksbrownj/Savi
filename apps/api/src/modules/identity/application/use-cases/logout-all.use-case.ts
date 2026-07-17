import { Inject, Injectable } from '@nestjs/common';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';

@Injectable()
export class LogoutAllUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.refreshTokens.revokeAll(userId);
  }
}
