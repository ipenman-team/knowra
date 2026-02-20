import { expect, test } from '@playwright/test';

const DEFAULT_ACCOUNT =
  process.env.PW_LOGIN_ACCOUNT ?? 'm18210870360@163.com';
const DEFAULT_PASSWORD = process.env.PW_LOGIN_PASSWORD ?? 'ajieiaxin';

type Role = {
  id: string;
  tenantId: string;
  spaceId: string;
  name: string;
  description: string | null;
  isBuiltIn: boolean;
  builtInType: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  permissions: string[];
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

type Member = {
  id: string;
  spaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  spaceRoleId: string | null;
  roleName: string;
  roleBuiltInType: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  roleIsBuiltIn: boolean;
  nickname: string | null;
  avatarUrl: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
};

type MockState = {
  roles: Role[];
  members: Member[];
  batchRoleUpdateCalls: Array<{
    memberIds: string[];
    roleId: string;
  }>;
  roleUpdateCalls: Array<{
    roleId: string;
    permissions?: string[];
  }>;
  denyBatchRoleUpdate: boolean;
  denyRoleUpdate: boolean;
};

function createDefaultRoles(now: string): Role[] {
  return [
    {
      id: 's1_role_owner',
      tenantId: 't1',
      spaceId: 's1',
      name: '所有者',
      description: 'owner',
      isBuiltIn: true,
      builtInType: 'OWNER',
      permissions: ['space.view'],
      createdBy: 'u1',
      updatedBy: 'u1',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 's1_role_admin',
      tenantId: 't1',
      spaceId: 's1',
      name: '管理员',
      description: 'admin',
      isBuiltIn: true,
      builtInType: 'ADMIN',
      permissions: ['space.view', 'space.member.role_change'],
      createdBy: 'u1',
      updatedBy: 'u1',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 's1_role_member',
      tenantId: 't1',
      spaceId: 's1',
      name: '成员',
      description: 'member',
      isBuiltIn: true,
      builtInType: 'MEMBER',
      permissions: ['space.view'],
      createdBy: 'u1',
      updatedBy: 'u1',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'r_custom_reviewer',
      tenantId: 't1',
      spaceId: 's1',
      name: '审阅者',
      description: 'custom',
      isBuiltIn: false,
      builtInType: null,
      permissions: [],
      createdBy: 'u1',
      updatedBy: 'u1',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function createDefaultMembers(now: string): Member[] {
  return [
    {
      id: 'm_owner',
      spaceId: 's1',
      userId: 'u1',
      role: 'OWNER',
      spaceRoleId: 's1_role_owner',
      roleName: '所有者',
      roleBuiltInType: 'OWNER',
      roleIsBuiltIn: true,
      nickname: 'Owner',
      avatarUrl: null,
      email: DEFAULT_ACCOUNT,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'm_member_1',
      spaceId: 's1',
      userId: 'u2',
      role: 'MEMBER',
      spaceRoleId: 's1_role_member',
      roleName: '成员',
      roleBuiltInType: 'MEMBER',
      roleIsBuiltIn: true,
      nickname: 'Bob',
      avatarUrl: null,
      email: 'bob@example.com',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

async function setupApiMocks(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await page.route(/http:\/\/(localhost|127\.0\.0\.1):3001\/.*/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method().toUpperCase();

    const fulfillJson = async (payload: unknown, status = 200) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    };

    if (path === '/auth/login-by-password' && method === 'POST') {
      await fulfillJson({ ok: true });
      return;
    }

    if (path === '/auth/switch-tenant' && method === 'POST') {
      await fulfillJson({
        ok: true,
        tenant: {
          id: 't1',
          type: 'PERSONAL',
          key: null,
          name: 'Personal',
        },
      });
      return;
    }

    if (path === '/users/me' && method === 'GET') {
      await fulfillJson({
        ok: true,
        user: { id: 'u1' },
        profile: {
          nickname: 'Tester',
          avatarUrl: null,
          bio: null,
          phone: null,
        },
        tenant: {
          id: 't1',
          type: 'PERSONAL',
          key: null,
          name: 'Personal',
        },
        memberships: [
          {
            role: 'OWNER',
            tenant: {
              id: 't1',
              type: 'PERSONAL',
              key: null,
              name: 'Personal',
            },
          },
        ],
        verification: {
          email: { bound: true, verified: true, identifier: DEFAULT_ACCOUNT },
          phone: { bound: false, verified: false, identifier: null },
          password: { set: true },
        },
      });
      return;
    }

    if (path === '/spaces' && method === 'GET') {
      await fulfillJson({
        items: [
          {
            id: 's1',
            tenantId: 't1',
            name: '测试空间',
            description: null,
            icon: null,
            color: '#60a5fa',
            identifier: 'S1',
            type: 'ORG',
            isArchived: false,
            metadata: {},
            createdBy: 'u1',
            updatedBy: 'u1',
            createdAt: state.roles[0]?.createdAt,
            updatedAt: state.roles[0]?.updatedAt,
          },
        ],
        total: 1,
      });
      return;
    }

    if (path === '/spaces/s1' && method === 'GET') {
      await fulfillJson({
        id: 's1',
        tenantId: 't1',
        name: '测试空间',
        description: null,
        icon: null,
        color: '#60a5fa',
        identifier: 'S1',
        type: 'ORG',
        isArchived: false,
        metadata: {},
        createdBy: 'u1',
        updatedBy: 'u1',
        createdAt: state.roles[0]?.createdAt,
        updatedAt: state.roles[0]?.updatedAt,
      });
      return;
    }

    if (path === '/spaces/s1/pages/tree' && method === 'GET') {
      await fulfillJson({
        items: [],
        nextCursor: null,
        hasMore: false,
      });
      return;
    }

    if (path === '/spaces/s1/pages' && method === 'GET') {
      await fulfillJson([]);
      return;
    }

    if (path === '/spaces/s1/members' && method === 'GET') {
      const skip = Number(url.searchParams.get('skip') ?? '0');
      const take = Number(url.searchParams.get('take') ?? '20');
      const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();

      const filtered = q
        ? state.members.filter((member) =>
            `${member.nickname ?? ''} ${member.email ?? ''}`
              .toLowerCase()
              .includes(q),
          )
        : state.members;

      await fulfillJson({
        items: filtered.slice(skip, skip + take),
        total: filtered.length,
        skip,
        take,
      });
      return;
    }

    if (path === '/spaces/s1/members/batch-role' && method === 'PUT') {
      const body = request.postDataJSON() as {
        memberIds?: string[];
        roleId?: string;
      };

      state.batchRoleUpdateCalls.push({
        memberIds: Array.isArray(body.memberIds) ? body.memberIds : [],
        roleId: String(body.roleId ?? ''),
      });

      if (state.denyBatchRoleUpdate) {
        await fulfillJson({ message: 'forbidden' }, 403);
        return;
      }

      const role = state.roles.find((item) => item.id === body.roleId);
      for (const memberId of body.memberIds ?? []) {
        const member = state.members.find((item) => item.id === memberId);
        if (!member || !role) continue;
        member.spaceRoleId = role.id;
        member.roleName = role.name;
        member.roleBuiltInType = role.builtInType;
        member.role = role.builtInType === 'ADMIN' ? 'ADMIN' : role.builtInType === 'OWNER' ? 'OWNER' : 'MEMBER';
      }

      await fulfillJson({ ok: true, affected: body.memberIds?.length ?? 0 });
      return;
    }

    if (path === '/spaces/s1/roles' && method === 'GET') {
      await fulfillJson(state.roles);
      return;
    }

    const roleUpdateMatch = /^\/spaces\/s1\/roles\/([^/]+)$/.exec(path);
    if (roleUpdateMatch && method === 'PUT') {
      const roleId = decodeURIComponent(roleUpdateMatch[1] ?? '');
      const body = request.postDataJSON() as {
        permissions?: string[];
      };

      state.roleUpdateCalls.push({
        roleId,
        permissions: body.permissions,
      });

      if (state.denyRoleUpdate) {
        await fulfillJson({ message: 'forbidden' }, 403);
        return;
      }

      const role = state.roles.find((item) => item.id === roleId);
      if (role) {
        role.permissions = Array.isArray(body.permissions)
          ? body.permissions
          : role.permissions;
      }

      await fulfillJson(role ?? { message: 'not found' }, role ? 200 : 404);
      return;
    }

    if (path === '/notifications/unread-count' && method === 'GET') {
      await fulfillJson({ count: 0 });
      return;
    }

    if (path === '/notifications' && method === 'GET') {
      await fulfillJson({ items: [], nextCursor: null, hasMore: false });
      return;
    }

    if (path === '/notifications/stream' && method === 'GET') {
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache, no-transform',
          connection: 'keep-alive',
        },
        body: 'event: unread_count_sync\ndata: {"count":0}\n\n',
      });
      return;
    }

    if (method === 'GET') {
      await fulfillJson({ ok: true });
      return;
    }

    await fulfillJson({ ok: true });
  });
}

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: '账号密码' }).click();
  await page.getByPlaceholder('邮箱或手机号').fill(DEFAULT_ACCOUNT);
  await page.getByPlaceholder('请输入密码').fill(DEFAULT_PASSWORD);
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL('**/workbench');
}

test('members page shows error toast when permission denied on batch role update', async ({
  page,
}) => {
  const now = new Date().toISOString();
  const state: MockState = {
    roles: createDefaultRoles(now),
    members: createDefaultMembers(now),
    batchRoleUpdateCalls: [],
    roleUpdateCalls: [],
    denyBatchRoleUpdate: true,
    denyRoleUpdate: false,
  };

  await setupApiMocks(page, state);
  await login(page);

  await page.goto('/spaces/s1/members');
  await expect(page.getByRole('heading', { name: '成员管理' })).toBeVisible();

  await page.locator('tbody [role="checkbox"]').first().click();

  await page.locator('[role="combobox"]').first().click();
  await page.getByRole('option', { name: '管理员' }).click();
  await page.getByRole('button', { name: '设置角色' }).click();

  await expect.poll(() => state.batchRoleUpdateCalls.length).toBe(1);
  await expect(page.getByText('批量角色更新失败')).toBeVisible();
});

test('roles page shows error toast when permission denied on save', async ({
  page,
}) => {
  const now = new Date().toISOString();
  const state: MockState = {
    roles: createDefaultRoles(now),
    members: createDefaultMembers(now),
    batchRoleUpdateCalls: [],
    roleUpdateCalls: [],
    denyBatchRoleUpdate: false,
    denyRoleUpdate: true,
  };

  await setupApiMocks(page, state);
  await login(page);

  await page.goto('/spaces/s1/roles');
  await expect(page.getByRole('heading', { name: '角色管理' })).toBeVisible();

  await page.getByRole('button', { name: '审阅者' }).click();
  await page.locator('[role="checkbox"]').first().click();
  await page.getByRole('button', { name: '保存' }).click();

  await expect.poll(() => state.roleUpdateCalls.length).toBe(1);
  await expect(page.getByText('角色保存失败')).toBeVisible();
});
