import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function buildReflector(permissions?: string[], roles?: string[]) {
  return {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === 'permissions') return permissions;
      if (key === 'roles') return roles;
      return undefined;
    }),
  } as unknown as Reflector;
}

function buildContext(user: any): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function buildPrisma(permCodes: string[]) {
  return {
    rolePermission: {
      findMany: jest
        .fn()
        .mockResolvedValue(permCodes.map((code) => ({ permission: { code } }))),
    },
  };
}

describe('RolesGuard', () => {
  it('passes when no permissions required', async () => {
    const guard = new RolesGuard(
      buildReflector(undefined),
      buildPrisma([]) as any,
    );
    const ctx = buildContext({ id: 'u1', roleId: 'r1' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('passes when user has the required permission', async () => {
    const guard = new RolesGuard(
      buildReflector(['orders:approve']),
      buildPrisma(['orders:approve']) as any,
    );
    const ctx = buildContext({ id: 'u1', roleId: 'r1' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException when user lacks the required permission', async () => {
    const guard = new RolesGuard(
      buildReflector(['orders:approve']),
      buildPrisma(['orders:view']) as any,
    );
    const ctx = buildContext({ id: 'u1', roleId: 'r1' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user has no roleId', async () => {
    const guard = new RolesGuard(
      buildReflector(['orders:approve']),
      buildPrisma([]) as any,
    );
    const ctx = buildContext({ id: 'u1', roleId: null });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
