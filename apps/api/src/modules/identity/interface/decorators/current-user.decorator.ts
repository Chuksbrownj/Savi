import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../infrastructure/jwt/jwt.strategy';

/**
 * @CurrentUser() — extracts the authenticated user from the request.
 * Populated by JwtStrategy.validate() after the JWT is verified.
 *
 * Usage:
 *   @Get('me')
 *   getProfile(@CurrentUser() user: AuthenticatedUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | 'sub' | undefined,
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!data) return user;
    if (data === 'sub') return user.id;
    return user[data as keyof AuthenticatedUser];
  },
);
