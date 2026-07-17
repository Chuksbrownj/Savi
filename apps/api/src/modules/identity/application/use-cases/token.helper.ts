import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as crypto from 'crypto';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { TokenPairDto } from '../dtos/auth-response.dto';

/** Parse a duration string like '7d', '15m', '1h' into milliseconds. */
function parseDuration(s: string): number {
  const units: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  const match = /^(\d+)([smhd])$/.exec(s);
  if (!match) return 7 * 86_400_000; // default 7 days
  return parseInt(match[1], 10) * (units[match[2]] ?? 86_400_000);
}

/**
 * Shared helper: issue an access + refresh token pair for a user.
 * The refresh token is stored as a SHA-256 hash (not plaintext) in the DB.
 */
export async function createTokenPair(
  user: User & {
    staffProfile?: {
      roleId: string;
      businessId: string;
      branchId: string;
    } | null;
  },
  jwtService: JwtService,
  config: ConfigService,
  refreshTokenRepo: IRefreshTokenRepository,
): Promise<TokenPairDto> {
  const payload = {
    sub: user.id,
    userType: user.userType,
    roleId: user.staffProfile?.roleId ?? null,
    businessId: user.staffProfile?.businessId ?? null,
    branchId: user.staffProfile?.branchId ?? null,
  };

  const accessToken = jwtService.sign(payload, {
    expiresIn: config.get<string>('jwt.accessExpiresIn', '15m') as any,
  });

  // Generate a random opaque refresh token; store its hash in DB
  const rawRefreshToken = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawRefreshToken)
    .digest('hex');

  const refreshExpiresIn = config.get<string>('jwt.refreshExpiresIn', '7d');
  const expiresAt = new Date(Date.now() + parseDuration(refreshExpiresIn));

  await refreshTokenRepo.create({ userId: user.id, tokenHash, expiresAt });

  return { accessToken, refreshToken: rawRefreshToken };
}

/**
 * Hash a raw refresh token the same way it was stored.
 */
export function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
