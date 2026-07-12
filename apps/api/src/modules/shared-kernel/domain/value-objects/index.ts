/**
 * Shared Kernel — Common value objects, types, and utilities
 * used across all bounded contexts.
 */

// ─── Money ───────────────────────────────────────────────────────────────────

export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'NGN',
  ) {
    if (amount < 0) throw new Error('Money amount cannot be negative');
  }

  add(other: Money): Money {
    if (this.currency !== other.currency)
      throw new Error('Currency mismatch');
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency)
      throw new Error('Currency mismatch');
    return new Money(this.amount - other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}

// ─── Address ─────────────────────────────────────────────────────────────────

export class Address {
  constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly state: string,
    public readonly country: string = 'Nigeria',
    public readonly postalCode?: string,
    public readonly latitude?: number,
    public readonly longitude?: number,
  ) {}

  toString(): string {
    return `${this.street}, ${this.city}, ${this.state}, ${this.country}`;
  }
}

// ─── PhoneNumber ──────────────────────────────────────────────────────────────

export class PhoneNumber {
  private static readonly PATTERN = /^\+?[1-9]\d{6,14}$/;

  constructor(public readonly value: string) {
    if (!PhoneNumber.PATTERN.test(value)) {
      throw new Error(`Invalid phone number: ${value}`);
    }
  }

  toString(): string {
    return this.value;
  }
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class Pagination {
  static buildMeta(total: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

// ─── Result / Either ─────────────────────────────────────────────────────────

export class Result<T, E = Error> {
  private constructor(
    private readonly _isOk: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  static ok<T>(value: T): Result<T, never> {
    return new Result<T, never>(true, value);
  }

  static fail<E>(error: E): Result<never, E> {
    return new Result<never, E>(false, undefined, error);
  }

  get isOk(): boolean { return this._isOk; }
  get isErr(): boolean { return !this._isOk; }

  getValue(): T {
    if (!this._isOk) throw new Error('Cannot get value of a failed Result');
    return this._value as T;
  }

  getError(): E {
    if (this._isOk) throw new Error('Cannot get error of a successful Result');
    return this._error as E;
  }
}

// ─── AuditLog ─────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
