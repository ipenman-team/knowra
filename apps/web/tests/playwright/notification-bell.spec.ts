import { expect, test } from '@playwright/test';

const DEFAULT_ACCOUNT = process.env.PW_LOGIN_ACCOUNT ?? 'm18210870360@163.com';
const DEFAULT_PASSWORD = process.env.PW_LOGIN_PASSWORD ?? 'ajieiaxin';

test('notification bell shows unread badge and opens panel', async ({ page }) => {
  let unreadCount = 2;
  let markAllCalled = false;

  const notificationItems = [
    {
      id: 'n1',
      tenantId: 't1',
      receiverId: 'u1',
      senderId: null,
      type: 'AI_DONE',
      title: '知识库索引已完成',
      body: '可以开始问答了',
      link: '/workbench',
      metadata: null,
      requestId: 'req-1',
      isRead: false,
      readAt: null,
      createdBy: 'system',
      updatedBy: 'system',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  await page.route('**://localhost:3001/**', async (route) => {
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
      await fulfillJson({ items: [], total: 0 });
      return;
    }

    if (path === '/notifications/unread-count' && method === 'GET') {
      await fulfillJson({ count: unreadCount });
      return;
    }

    if (path === '/notifications' && method === 'GET') {
      await fulfillJson({
        items: notificationItems,
        nextCursor: null,
        hasMore: false,
      });
      return;
    }

    if (path === '/notifications/read-all' && method === 'PATCH') {
      markAllCalled = true;
      unreadCount = 0;
      for (const item of notificationItems) item.isRead = true;
      await fulfillJson({ count: 1 });
      return;
    }

    if (/^\/notifications\/[^/]+\/read$/.test(path) && method === 'PATCH') {
      unreadCount = Math.max(0, unreadCount - 1);
      await fulfillJson({ updated: true });
      return;
    }

    if (/^\/notifications\/[^/]+$/.test(path) && method === 'DELETE') {
      unreadCount = Math.max(0, unreadCount - 1);
      await fulfillJson({ deleted: true });
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
        body: `event: unread_count_sync\ndata: {"count": ${unreadCount}}\n\n`,
      });
      return;
    }

    if (method === 'GET') {
      await fulfillJson({ ok: true });
      return;
    }

    await fulfillJson({ ok: true });
  });

  await page.goto('/login');
  await page.getByRole('button', { name: '账号密码' }).click();
  await page.getByPlaceholder('邮箱或手机号').fill(DEFAULT_ACCOUNT);
  await page.getByPlaceholder('请输入密码').fill(DEFAULT_PASSWORD);
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByRole('button', { name: '登录', exact: true }).click();

  await page.waitForURL('**/workbench');

  const bell = page.getByRole('button', { name: 'notifications' });
  await expect(bell).toBeVisible();
  await expect(bell.locator('span').filter({ hasText: /^2$/ })).toBeVisible();

  await bell.click();
  await expect(page.getByText('通知')).toBeVisible();
  await expect(page.getByText('知识库索引已完成')).toBeVisible();

  await page.getByRole('button', { name: '全部已读' }).click();
  await expect.poll(() => markAllCalled).toBe(true);
});
