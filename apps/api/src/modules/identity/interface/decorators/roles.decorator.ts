import { SetMetadata } from '@nestjs/common';
import { UserType } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * @Roles(...roles) — declares the user types required to access a route.
 * Enforced by RolesGuard.
 *
 * Usage:
 *   @Roles(UserType.Customer)
 *   @Get('profile')
 *   getProfile(...) { ... }
 */
export const Roles = (...roles: UserType[]) => SetMetadata(ROLES_KEY, roles);
