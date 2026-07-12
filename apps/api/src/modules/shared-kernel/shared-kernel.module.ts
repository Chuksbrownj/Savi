import { Module } from '@nestjs/common';

/**
 * Shared Kernel Module
 * Provides common value objects, utilities, and types shared across
 * all bounded contexts: Money, Address, PhoneNumber, AuditLog,
 * Pagination, Result/Either.
 */
@Module({
  exports: [],
})
export class SharedKernelModule {}
