import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * @RequirePermissions(...codes) — declares the permission codes required to
 * access a route. Enforced by RolesGuard.
 *
 * Usage:
 *   @RequirePermissions('orders:approve')
 *   @Post('orders/:id/approve')
 *   approve(...) { ... }
 */
export const RequirePermissions = (...codes: string[]) =>
  SetMetadata(PERMISSIONS_KEY, codes);
