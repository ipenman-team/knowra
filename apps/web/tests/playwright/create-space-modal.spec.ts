import { expect, test } from '@playwright/test';

const DEFAULT_ACCOUNT =
  process.env.PW_LOGIN_ACCOUNT ?? 'm18210870360@163.com';
const DEFAULT_PASSWORD = process.env.PW_LOGIN_PASSWORD ?? 'ajieiaxin';

type MockState = {
  createdSpaces: Array<{
    id: string;
    tenantId: string;
    name: string;
    identifier: string | null;
    type: string;
    isArchived: boolean;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
  }>;
  emailInviteCalls: Array<{ spaceId: string; emails: string[]; role?: string }>;
  linkInviteCalls: Array<{ spaceId: string; role?: string }>;
};

async function setupApiMocks(page: import('@playwright/test').Page, state: MockState) {
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
      const body = request.postDataJSON() as { tenantId?: string };
      const tenantId = body?.tenantId ?? 't1';
      await fulfillJson({
        ok: true,
        tenant: {
          id: tenantId,
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
      await fulfillJson({ items: state.createdSpaces, total: state.createdSpaces.length });
      return;
    }

    if (path === '/spaces' && method === 'POST') {
      const body = request.postDataJSON() as {
        name?: string;
        identifier?: string;
        type?: string;
      };
      const id = `s${state.createdSpaces.length + 1}`;
      const now = new Date().toISOString();
      const created = {
        id,
        tenantId: 't1',
        name: body.name ?? 'Unnamed',
        description: null,
        icon: null,
        color: '#60a5fa',
        identifier: body.identifier ?? null,
        type: body.type ?? 'PERSONAL',
        isArchived: false,
        metadata: {},
        createdBy: 'u1',
        updatedBy: 'u1',
        createdAt: now,
        updatedAt: now,
      };
      state.createdSpaces.unshift(created);
      await fulfillJson(created);
      return;
    }

    const emailInviteMatch = /^\/spaces\/([^/]+)\/invitations$/.exec(path);
    if (emailInviteMatch && method === 'POST') {
      const spaceId = decodeURIComponent(emailInviteMatch[1] ?? '');
      const body = request.postDataJSON() as { emails?: string[]; role?: string };
      state.emailInviteCalls.push({
        spaceId,
        emails: Array.isArray(body.emails) ? body.emails : [],
        role: body.role,
      });

      const now = new Date().toISOString();
      const items = (body.emails ?? []).map((email, index) => ({
        invitation: {
          id: `inv-${spaceId}-${index + 1}`,
          tenantId: 't1',
          spaceId,
          inviterUserId: 'u1',
          inviteeEmail: email,
          inviteeUserId: null,
          role: body.role ?? 'MEMBER',
          channel: 'EMAIL',
          status: 'PENDING',
          expiresAt: now,
          acceptedAt: null,
          acceptedBy: null,
          sentAt: now,
          resendCount: 0,
          createdAt: now,
          updatedAt: now,
        },
        inviteToken: `token-${index + 1}`,
        inviteUrl: `/invite/space?token=token-${index + 1}`,
      }));
      await fulfillJson({ items });
      return;
    }

    const linkInviteMatch = /^\/spaces\/([^/]+)\/invitations\/link$/.exec(path);
    if (linkInviteMatch && method === 'POST') {
      const spaceId = decodeURIComponent(linkInviteMatch[1] ?? '');
      const body = request.postDataJSON() as { role?: string };
      state.linkInviteCalls.push({ spaceId, role: body.role });
      const now = new Date().toISOString();
      await fulfillJson({
        invitation: {
          id: `link-${spaceId}`,
          tenantId: 't1',
          spaceId,
          inviterUserId: 'u1',
          inviteeEmail: null,
          inviteeUserId: null,
          role: body.role ?? 'MEMBER',
          channel: 'LINK',
          status: 'PENDING',
          expiresAt: now,
          acceptedAt: null,
          acceptedBy: null,
          sentAt: now,
          resendCount: 0,
          createdAt: now,
          updatedAt: now,
        },
        inviteToken: 'link-token',
        inviteUrl: '/invite/space?token=link-token',
      });
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

async function openCreateSpaceModal(page: import('@playwright/test').Page) {
  const group = page
    .locator('[data-sidebar="group-label"]')
    .filter({ hasText: /空间|Spaces/ })
    .first();
  await expect(group).toBeVisible();

  await group.locator('button').first().click();
  await expect(page.getByText('创建空间')).toBeVisible();
}

test('collaborative space creation sends email invitations', async ({ page }) => {
  const state: MockState = {
    createdSpaces: [],
    emailInviteCalls: [],
    linkInviteCalls: [],
  };
  await setupApiMocks(page, state);

  await login(page);
  await openCreateSpaceModal(page);

  await page.locator('#create-space-name').fill('团队协作空间');
  await page.locator('#create-space-identifier').fill('TEAM001');
  await page.locator('#create-space-type').click();
  await page.getByRole('option', { name: '协作空间' }).click();

  await page.getByRole('button', { name: '下一步' }).click();
  await expect(page.getByRole('heading', { name: '邀请成员' })).toBeVisible();

  await page
    .locator('#create-space-invite-input')
    .fill('alpha@example.com\nbeta@example.com');
  await page.getByRole('button', { name: '添加到邀请列表' }).click();

  await page.getByRole('button', { name: '创建并发送邀请' }).click();
  await expect(page.getByRole('heading', { name: '创建空间' })).not.toBeVisible();

  expect(state.createdSpaces).toHaveLength(1);
  expect(state.createdSpaces[0]?.type).toBe('ORG');

  expect(state.emailInviteCalls).toHaveLength(1);
  expect(state.emailInviteCalls[0]).toMatchObject({
    spaceId: 's1',
    role: 'MEMBER',
    emails: ['alpha@example.com', 'beta@example.com'],
  });

  expect(state.linkInviteCalls).toHaveLength(0);
});

test('collaborative space creation can skip invitations', async ({ page }) => {
  const state: MockState = {
    createdSpaces: [],
    emailInviteCalls: [],
    linkInviteCalls: [],
  };
  await setupApiMocks(page, state);

  await login(page);
  await openCreateSpaceModal(page);

  await page.locator('#create-space-name').fill('可跳过邀请空间');
  await page.locator('#create-space-identifier').fill('TEAMSKIP');
  await page.locator('#create-space-type').click();
  await page.getByRole('option', { name: '协作空间' }).click();

  await page.getByRole('button', { name: '下一步' }).click();
  await expect(page.getByRole('heading', { name: '邀请成员' })).toBeVisible();

  await page.getByRole('button', { name: '跳过，创建空间' }).click();
  await expect(page.getByRole('heading', { name: '创建空间' })).not.toBeVisible();

  expect(state.createdSpaces).toHaveLength(1);
  expect(state.createdSpaces[0]?.type).toBe('ORG');

  expect(state.emailInviteCalls).toHaveLength(0);
  expect(state.linkInviteCalls).toHaveLength(0);
});
