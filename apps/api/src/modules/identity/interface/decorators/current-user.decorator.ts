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
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser;
  },
);
