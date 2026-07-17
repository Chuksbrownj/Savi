import * as argon2 from 'argon2';

/**
 * Password value object.
 * Encapsulates hashing and verification logic using Argon2id.
 * The raw password is NEVER stored — only the hash.
 */
export class Password {
  private constructor(private readonly _hash: string) {}

  /** Hash a plaintext password and return a Password value object. */
  static async create(plainText: string): Promise<Password> {
    const hash = await argon2.hash(plainText, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MiB
      timeCost: 3,
      parallelism: 1,
    });
    return new Password(hash);
  }

  /** Wrap an already-hashed password (e.g. loaded from DB). */
  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  /** Verify a plaintext password against this stored hash. */
  async verify(plainText: string): Promise<boolean> {
    return argon2.verify(this._hash, plainText);
  }

  /** Return the raw hash string for persistence. */
  get hash(): string {
    return this._hash;
  }
}
