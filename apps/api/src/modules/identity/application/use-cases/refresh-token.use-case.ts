import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { TokenPairDto } from '../dtos/auth-response.dto';
import { createTokenPair, hashRefreshToken } from './token.helper';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(rawRefreshToken: string): Promise<TokenPairDto> {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      include: { staffProfile: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Issue a new token pair
    const tokens = await createTokenPair(
      user,
      this.jwt,
      this.config,
      this.refreshTokens,
    );

    // Revoke the old token, linking it to the new one (for audit trail)
    // Find the newly created token hash to get its ID
    const newHash = hashRefreshToken(tokens.refreshToken);
    const newToken = await this.refreshTokens.findByHash(newHash);
    await this.refreshTokens.revoke(stored.id, newToken?.id);

    return tokens;
  }
}
