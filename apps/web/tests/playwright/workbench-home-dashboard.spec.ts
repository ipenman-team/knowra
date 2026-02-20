import { expect, test } from '@playwright/test';

const DEFAULT_ACCOUNT =
  process.env.PW_LOGIN_ACCOUNT ?? 'm18210870360@163.com';
const DEFAULT_PASSWORD = process.env.PW_LOGIN_PASSWORD ?? 'ajieiaxin';

type MockState = {
  spaces: Array<{
    id: string;
    tenantId: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    identifier: string | null;
    type: string;
    isArchived: boolean;
    metadata: Record<string, unknown>;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagesBySpaceId: Record<
    string,
    Array<{
      id: string;
      tenantId: string;
      spaceId: string;
      title: string;
      parentIds: string[];
      latestPublishedVersionId: string | null;
      content: unknown;
      createdAt: string;
      updatedAt: string;
    }>
  >;
};

function nowIso() {
  return new Date().toISOString();
}

function makeRecentVisitActivities() {
  const items: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 23; i += 1) {
    items.push({
      id: `a-${i}`,
      action: 'page.view',
      actionName: '访问页面',
      content: `Recent Page ${i}`,
      subjectType: 'page',
      subjectId: `rp-${i}`,
      actorUserId: 'u1',
      createdAt: new Date(Date.now() - i * 60_000).toISOString(),
      metadata: {
        spaceId: 's1',
        title: `Recent Page ${i}`,
      },
    });
  }

  items.splice(3, 0, {
    id: 'a-dup',
    action: 'page.view',
    actionName: '访问页面',
    content: 'Recent Page 0',
    subjectType: 'page',
    subjectId: 'rp-0',
    actorUserId: 'u1',
    createdAt: new Date(Date.now() - 24 * 60_000).toISOString(),
    metadata: {
      spaceId: 's1',
      title: 'Recent Page 0',
    },
  });

  return items;
}

async function setupApiMocks(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  const recentVisitItems = makeRecentVisitActivities();

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
      await fulfillJson({ items: state.spaces, total: state.spaces.length });
      return;
    }

    if (path === '/spaces' && method === 'POST') {
      const body = request.postDataJSON() as {
        name?: string;
        identifier?: string;
        type?: string;
      };
      const created = {
        id: 's2',
        tenantId: 't1',
        name: body.name ?? 'New Space',
        description: null,
        icon: null,
        color: '#60a5fa',
        identifier: body.identifier ?? 'S2',
        type: body.type ?? 'PERSONAL',
        isArchived: false,
        metadata: {},
        createdBy: 'u1',
        updatedBy: 'u1',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.spaces.unshift(created);
      state.pagesBySpaceId.s2 = [];
      await fulfillJson(created);
      return;
    }

    const createPageMatch = /^\/spaces\/([^/]+)\/pages$/.exec(path);
    if (createPageMatch && method === 'POST') {
      const spaceId = decodeURIComponent(createPageMatch[1] ?? '');
      const body = request.postDataJSON() as { title?: string };
      const created = {
        id: 'p-created',
        tenantId: 't1',
        spaceId,
        title: body.title ?? '无标题文档',
        parentIds: [],
        latestPublishedVersionId: null,
        content: [{ type: 'paragraph', children: [{ text: '' }] }],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.pagesBySpaceId[spaceId] = [created, ...(state.pagesBySpaceId[spaceId] ?? [])];
      await fulfillJson(created);
      return;
    }

    const getPageMatch = /^\/spaces\/([^/]+)\/pages\/([^/]+)$/.exec(path);
    if (getPageMatch && method === 'GET') {
      const spaceId = decodeURIComponent(getPageMatch[1] ?? '');
      const pageId = decodeURIComponent(getPageMatch[2] ?? '');
      const page = (state.pagesBySpaceId[spaceId] ?? []).find((item) => item.id === pageId);
      await fulfillJson(
        page ?? {
          id: pageId,
          tenantId: 't1',
          spaceId,
          title: 'Loaded Page',
          parentIds: [],
          latestPublishedVersionId: null,
          content: [{ type: 'paragraph', children: [{ text: '' }] }],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      );
      return;
    }

    const treeMatch = /^\/spaces\/([^/]+)\/pages\/tree$/.exec(path);
    if (treeMatch && method === 'GET') {
      const spaceId = decodeURIComponent(treeMatch[1] ?? '');
      const list = state.pagesBySpaceId[spaceId] ?? [];
      await fulfillJson({
        items: list.map((page) => ({
          ...page,
          content: undefined,
        })),
        nextCursor: null,
        hasMore: false,
      });
      return;
    }

    if (path === '/activities/stats/daily' && method === 'GET') {
      await fulfillJson({
        items: [{ date: '2026-02-20', count: 7 }],
      });
      return;
    }

    if (path === '/activities' && method === 'GET') {
      const action = url.searchParams.get('action');
      if (action === 'page.view') {
        await fulfillJson({
          items: recentVisitItems,
          nextCursor: null,
          hasMore: false,
        });
        return;
      }

      await fulfillJson({
        items: [
          {
            id: 'day-1',
            action: 'page.create',
            actionName: '新建页面',
            content: '首页',
            subjectType: 'page',
            subjectId: 'p1',
            actorUserId: 'u1',
            createdAt: nowIso(),
            metadata: { title: '首页' },
          },
        ],
        nextCursor: null,
        hasMore: false,
      });
      return;
    }

    if (path === '/daily-copies/today' && method === 'GET') {
      await fulfillJson({
        item: {
          id: 'dc-1',
          date: '2026-02-20',
          content: '今天还没有生成文案。',
          metadata: { liked: false },
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
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

function getDefaultState(): MockState {
  return {
    spaces: [
      {
        id: 's1',
        tenantId: 't1',
        name: 'Default Space',
        description: null,
        icon: null,
        color: '#60a5fa',
        identifier: 'S1',
        type: 'PERSONAL',
        isArchived: false,
        metadata: {},
        createdBy: 'u1',
        updatedBy: 'u1',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ],
    pagesBySpaceId: {
      s1: [
        {
          id: 'p1',
          tenantId: 't1',
          spaceId: 's1',
          title: 'Existing Page',
          parentIds: [],
          latestPublishedVersionId: null,
          content: [{ type: 'paragraph', children: [{ text: '' }] }],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      ],
    },
  };
}

test('workbench defaults to home and can switch to dashboard', async ({ page }) => {
  const state = getDefaultState();
  await setupApiMocks(page, state);
  await login(page);

  await expect(page.getByRole('button', { name: /首页|Home/ })).toBeVisible();
  await expect(page.getByText(/快捷操作|Quick Actions/)).toBeVisible();
  await expect(page.getByText(/最近访问|Recent Visits/)).toBeVisible();
  await expect(page.getByTestId('workbench-recent-visit-card')).toHaveCount(20);
  await expect(page.getByText('Recent Page 0')).toHaveCount(1);

  await page.getByRole('button', { name: /仪表盘|Dashboard/ }).click();
  await expect(page.getByText(/当日动态|Today's activity log/)).toBeVisible();
});

test('create document enters edit mode and create space navigates to new space', async ({
  page,
}) => {
  const state = getDefaultState();
  await setupApiMocks(page, state);
  await login(page);

  await page.getByRole('button', { name: /新建文档|New Document/ }).click();
  const createDocDialog = page.getByRole('dialog');
  await expect(createDocDialog.getByText(/新建文档|New Document/)).toBeVisible();
  await createDocDialog.getByRole('button', { name: /创建|Create/ }).click();

  await page.waitForURL('**/spaces/s1/pages/p-created?mode=edit');
  await expect(page.getByRole('button', { name: /发布|Publish/ })).toBeVisible();

  await page.goto('/workbench');
  await page.getByRole('button', { name: /新建空间|New Space/ }).click();
  const createSpaceDialog = page.getByRole('dialog');
  await createSpaceDialog.getByPlaceholder('输入空间名称').fill('Playwright Space');
  await createSpaceDialog.getByPlaceholder('大写字母或数字，最长15').fill('PWSPACE2');
  await createSpaceDialog.getByRole('button', { name: '创建空间' }).click();

  await page.waitForURL('**/spaces/s2');
});
