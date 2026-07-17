import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function buildContext(
  user: any,
  handlerPermissions?: string[],
): ExecutionContext {
  const reflector = new Reflector();
  jest
    .spyOn(reflector, 'getAllAndOverride')
    .mockReturnValue(handlerPermissions ?? null);

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
    const guard = new RolesGuard(new Reflector(), buildPrisma([]) as any);
    const ctx = buildContext({ id: 'u1', roleId: 'r1' }, undefined);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('passes when user has the required permission', async () => {
    const guard = new RolesGuard(
      new Reflector(),
      buildPrisma(['orders:approve']) as any,
    );
    const ctx = buildContext({ id: 'u1', roleId: 'r1' }, ['orders:approve']);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException when user lacks the required permission', async () => {
    const guard = new RolesGuard(
      new Reflector(),
      buildPrisma(['orders:view']) as any,
    );
    const ctx = buildContext({ id: 'u1', roleId: 'r1' }, ['orders:approve']);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user has no roleId', async () => {
    const guard = new RolesGuard(new Reflector(), buildPrisma([]) as any);
    const ctx = buildContext({ id: 'u1', roleId: null }, ['orders:approve']);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
