import { RefreshToken } from '@prisma/client';

export type CreateRefreshTokenData = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

/**
 * IRefreshTokenRepository — domain repository interface for RefreshToken.
 * Supports token rotation: each refresh issues a new pair and revokes the old one.
 */
export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenData): Promise<RefreshToken>;
  findByHash(hash: string): Promise<RefreshToken | null>;
  /** Mark a single token as revoked, optionally linking to the replacement. */
  revoke(id: string, replacedById?: string): Promise<void>;
  /** Revoke all active refresh tokens for a user (used on logout-all / password reset). */
  revokeAll(userId: string): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('IRefreshTokenRepository');
