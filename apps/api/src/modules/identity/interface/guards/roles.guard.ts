import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../infrastructure/jwt/jwt.strategy';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserType } from '@prisma/client';

/**
 * RolesGuard — RBAC enforcement guard.
 *
 * Applied globally via APP_GUARD in AppModule.
 * Routes without @RequirePermissions() are treated as accessible to any
 * authenticated user (role-agnostic).
 *
 * Permissions are loaded from DB via the user's roleId.
 * Multi-tenancy: businessId from the JWT is the authoritative scope — never
 * trust businessId from the request body for access control.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Role check (UserType)
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.userType as any)) {
        throw new ForbiddenException('User type not authorized');
      }
    }

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    if (!user.roleId) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Load role permissions from DB
    const rolePerms = await this.prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: { permission: true },
    });

    const grantedCodes = new Set(rolePerms.map((rp) => rp.permission.code));
    const hasAll = requiredPermissions.every((p) => grantedCodes.has(p));

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
