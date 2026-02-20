import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { hasSpacePermission } from '@contexta/infrastructure';
import type { PrismaService } from '../../../../prisma/prisma.service';
import {
  __spacePermissionMiddlewareInternals,
  SpacePermissionMiddleware,
} from '../../space-permission.middleware';

jest.mock('@contexta/infrastructure', () => ({
  hasSpacePermission: jest.fn(),
}));

type MockReq = {
  method?: string;
  path?: string;
  originalUrl?: string;
  tenantId?: string;
  userId?: string;
};

describe('SpacePermissionMiddleware', () => {
  const mockedHasSpacePermission = hasSpacePermission as jest.MockedFunction<
    typeof hasSpacePermission
  >;

  const prisma = {} as PrismaService;
  const middleware = new SpacePermissionMiddleware(prisma);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('skips non-managed routes', async () => {
    const next = jest.fn();

    await middleware.use(
      {
        method: 'GET',
        path: '/spaces/s1/pages',
      } as MockReq as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockedHasSpacePermission).not.toHaveBeenCalled();
  });

  test('rejects managed routes without auth context', async () => {
    const next = jest.fn();

    await expect(
      middleware.use(
        {
          method: 'GET',
          path: '/spaces/s1/members',
        } as MockReq as any,
        {} as any,
        next,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(next).not.toHaveBeenCalled();
    expect(mockedHasSpacePermission).not.toHaveBeenCalled();
  });

  test('checks permission and allows request when granted', async () => {
    mockedHasSpacePermission.mockResolvedValue(true);
    const next = jest.fn();

    await middleware.use(
      {
        method: 'PUT',
        path: '/spaces/s1/members/batch-role',
        tenantId: 't1',
        userId: 'u1',
      } as MockReq as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockedHasSpacePermission).toHaveBeenCalledWith(prisma, {
      tenantId: 't1',
      spaceId: 's1',
      userId: 'u1',
      permission: 'space.member.role_change',
    });
  });

  test('rejects when permission denied', async () => {
    mockedHasSpacePermission.mockResolvedValue(false);
    const next = jest.fn();

    await expect(
      middleware.use(
        {
          method: 'DELETE',
          path: '/spaces/s1/roles/r1',
          tenantId: 't1',
          userId: 'u1',
        } as MockReq as any,
        {} as any,
        next,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(next).not.toHaveBeenCalled();
  });
});

describe('SpacePermissionMiddleware internals', () => {
  const { normalizePath, getSpaceIdFromPath, resolvePermissionByRoute } =
    __spacePermissionMiddlewareInternals;

  test('normalizes path', () => {
    expect(normalizePath('/spaces/s1/members/')).toBe('/spaces/s1/members');
  });

  test('extracts space id', () => {
    expect(getSpaceIdFromPath('/spaces/s1/roles/r1')).toBe('s1');
  });

  test('resolves route permission', () => {
    expect(resolvePermissionByRoute('GET', '/spaces/s1/members')).toBe(
      'space.member.view',
    );
    expect(resolvePermissionByRoute('POST', '/spaces/s1/invitations')).toBe(
      'space.member.invite',
    );
    expect(resolvePermissionByRoute('GET', '/spaces/s1/pages')).toBeNull();
  });
});
