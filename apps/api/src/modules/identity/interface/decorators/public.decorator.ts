import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() — marks a controller method (or an entire controller) as publicly
 * accessible, bypassing the global JwtAuthGuard.
 *
 * Use this on all auth endpoints: login, register, forgot-password, etc.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
