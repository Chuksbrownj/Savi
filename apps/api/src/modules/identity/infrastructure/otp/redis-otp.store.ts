import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as crypto from 'crypto';

const OTP_KEY_PREFIX = 'otp:';

/**
 * RedisOtpStore — stores and verifies time-limited OTPs in Redis.
 *
 * OTPs are stored as SHA-256 hashes to prevent exposure in case of a Redis breach.
 * The plaintext OTP is NEVER written to Redis.
 */
@Injectable()
export class RedisOtpStore {
  private readonly redis: Redis;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: config.get<string>('redis.host', 'localhost'),
      port: config.get<number>('redis.port', 6379),
      password: config.get<string | undefined>('redis.password'),
    });
  }

  private key(identifier: string): string {
    return `${OTP_KEY_PREFIX}${identifier}`;
  }

  private hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /** Store a hashed OTP with a TTL in seconds. */
  async set(
    identifier: string,
    code: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.setex(this.key(identifier), ttlSeconds, this.hash(code));
  }

  /** Returns true if the provided code matches the stored hash (and it hasn't expired). */
  async verify(identifier: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(this.key(identifier));
    if (!stored) return false;
    return stored === this.hash(code);
  }

  /** Delete the OTP (consume it after successful verification). */
  async delete(identifier: string): Promise<void> {
    await this.redis.del(this.key(identifier));
  }
}
