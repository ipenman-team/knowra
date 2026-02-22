import fs from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type BrowserContext, type Page, type Request } from '@playwright/test';

const OUTPUT_DIR = path.resolve(__dirname, '../../public/landing/scenes');
const SHOULD_CAPTURE = process.env.PW_CAPTURE_LANDING_SCENES === '1';
const APP_ORIGIN = 'http://127.0.0.1:3000';

const SCENE_FILES = {
  aiQuestionInternet: 'ai-question-internet.png',
  aiInsertPanel: 'ai-insert-panel.png',
  editorAiToolbar: 'editor-ai-toolbar.png',
  editorAiResult: 'editor-ai-result.png',
  aiSearchAllKnowledge: 'ai-search-all-knowledge.png',
} as const;

const TENANT = {
  id: 'tenant-knowra-growth',
  type: 'TEAM',
  key: 'knowra-growth',
  name: 'Knowra Growth Team',
};

const USER = {
  id: 'u-sophia-carter',
  nickname: 'Sophia Carter',
  avatarUrl: '/landing/placeholders/avatar-sophia.svg',
};

const SPACE_RECORDS = [
  {
    id: 's-product',
    tenantId: TENANT.id,
    name: 'Product Strategy Hub',
    description: 'Roadmap, positioning and launch assets',
    icon: null,
    color: '#3b82f6',
    identifier: 'PRD',
    type: 'TEAM',
    isArchived: false,
    metadata: {},
    createdBy: USER.id,
    updatedBy: USER.id,
  },
  {
    id: 's-sales',
    tenantId: TENANT.id,
    name: 'Enterprise Sales Playbook',
    description: 'Objections, battlecards and customer proof',
    icon: null,
    color: '#14b8a6',
    identifier: 'SAL',
    type: 'TEAM',
    isArchived: false,
    metadata: {},
    createdBy: USER.id,
    updatedBy: USER.id,
  },
];

type PageRecord = {
  id: string;
  tenantId: string;
  spaceId: string;
  title: string;
  parentIds: string[];
  latestPublishedVersionId: string | null;
  content: unknown[];
  createdAt: string;
  updatedAt: string;
};

type PageVersionRecord = {
  id: string;
  tenantId: string;
  pageId: string;
  status: 'PUBLISHED';
  title: string;
  content: unknown[];
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
};

const PAGE_RECORDS: Record<string, PageRecord> = {
  'p-launch-plan': {
    id: 'p-launch-plan',
    tenantId: TENANT.id,
    spaceId: 's-product',
    title: 'Q2 Launch Narrative',
    parentIds: [],
    latestPublishedVersionId: 'v-launch-plan',
    createdAt: '2026-02-11T08:00:00.000Z',
    updatedAt: '2026-02-21T09:20:00.000Z',
    content: [
      { type: 'heading-one', children: [{ text: 'Q2 Launch Narrative' }] },
      {
        type: 'paragraph',
        children: [
          {
            text: 'Knowra captures meeting notes and transforms them into reusable launch docs for cross-functional teams.',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: 'Key proof points include onboarding speed, policy-safe writing, and AI-assisted review loops.',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: 'Current CTA draft: Start with one strategic question, then publish a team-ready page in under 10 minutes.',
          },
        ],
      },
    ],
  },
  'p-eu-checklist': {
    id: 'p-eu-checklist',
    tenantId: TENANT.id,
    spaceId: 's-product',
    title: 'EU Compliance Checklist',
    parentIds: [],
    latestPublishedVersionId: null,
    createdAt: '2026-02-09T10:00:00.000Z',
    updatedAt: '2026-02-19T16:24:00.000Z',
    content: [{ type: 'paragraph', children: [{ text: 'Checklist placeholder' }] }],
  },
  'p-security-objections': {
    id: 'p-security-objections',
    tenantId: TENANT.id,
    spaceId: 's-sales',
    title: 'Security Procurement Objections',
    parentIds: [],
    latestPublishedVersionId: null,
    createdAt: '2026-02-07T10:00:00.000Z',
    updatedAt: '2026-02-20T08:40:00.000Z',
    content: [{ type: 'paragraph', children: [{ text: 'Sales notes placeholder' }] }],
  },
};

const PAGE_IDS_BY_SPACE: Record<string, string[]> = {
  's-product': ['p-launch-plan', 'p-eu-checklist'],
  's-sales': ['p-security-objections'],
};

const AI_CONVERSATIONS = [
  {
    id: 'c-internet',
    title: 'EU AI Launch Risks (Internet Only)',
    createdAt: '2026-02-21T08:00:00.000Z',
    updatedAt: '2026-02-21T08:05:00.000Z',
  },
  {
    id: 'c-knowledge',
    title: 'Security Objections from All Spaces',
    createdAt: '2026-02-21T08:08:00.000Z',
    updatedAt: '2026-02-21T08:10:00.000Z',
  },
];

const AI_MESSAGES: Record<string, Array<{ id: string; role: 'USER' | 'ASSISTANT'; content: string; createdAt: string }>> = {
  'c-internet': [
    {
      id: 'm-internet-user',
      role: 'USER',
      createdAt: '2026-02-21T08:01:00.000Z',
      content:
        'What are the top three regulatory risks for launching an AI note-taking product in the EU in 2026, and what should we mitigate in the first 90 days?',
    },
    {
      id: 'm-internet-assistant',
      role: 'ASSISTANT',
      createdAt: '2026-02-21T08:02:00.000Z',
      content: [
        'Top risks and first-90-day mitigations:',
        '1. GDPR lawful basis & purpose limitation: define processing purpose, data maps, retention schedule, and DPA templates before onboarding pilot users.',
        '2. AI Act transparency obligations: document model capabilities/limits, user-facing AI notices, and human override paths in product UI.',
        '3. Cross-border transfer exposure: finalize SCC workflow, subprocessor list, and regional storage controls for enterprise procurement reviews.',
        'Recommended action plan: appoint a compliance owner, run a DPIA by week 4, and publish a security + privacy FAQ for sales by week 8.',
      ].join('\n'),
    },
  ],
  'c-knowledge': [
    {
      id: 'm-knowledge-user',
      role: 'USER',
      createdAt: '2026-02-21T08:09:00.000Z',
      content:
        'Across all knowledge bases, summarize recurring enterprise security objections and draft response scripts for sales calls.',
    },
    {
      id: 'm-knowledge-assistant',
      role: 'ASSISTANT',
      createdAt: '2026-02-21T08:10:00.000Z',
      content: [
        'Summary from Product Strategy Hub + Enterprise Sales Playbook:',
        '- Objection: "Where is data stored?" Response: share region controls + tenant-level isolation model.',
        '- Objection: "Can we disable public model training?" Response: confirm no customer content is used for public training by default.',
        '- Objection: "How do you manage access?" Response: explain role boundaries, audit trails, and scoped sharing links.',
      ].join('\n'),
    },
  ],
};

type SourceConfig = {
  internetEnabled: boolean;
  spaceEnabled: boolean;
  spaceIds: string[];
  carryContext: boolean;
};

function nowIso(): string {
  return new Date().toISOString();
}

function cloneSourceConfig(config: SourceConfig): SourceConfig {
  return {
    internetEnabled: config.internetEnabled,
    spaceEnabled: config.spaceEnabled,
    spaceIds: [...config.spaceIds],
    carryContext: config.carryContext,
  };
}

function buildDefaultSourceMap(): Map<string, SourceConfig> {
  return new Map<string, SourceConfig>([
    [
      'c-internet',
      {
        internetEnabled: true,
        spaceEnabled: false,
        spaceIds: [],
        carryContext: true,
      },
    ],
    [
      'c-knowledge',
      {
        internetEnabled: true,
        spaceEnabled: true,
        spaceIds: [],
        carryContext: true,
      },
    ],
  ]);
}

function getPagesForSpace(spaceId: string): PageRecord[] {
  const ids = PAGE_IDS_BY_SPACE[spaceId] ?? [];
  return ids.map((id) => PAGE_RECORDS[id]).filter(Boolean);
}

function toPageDto(record: PageRecord, includeContent: boolean) {
  if (includeContent) return { ...record };
  return {
    id: record.id,
    tenantId: record.tenantId,
    spaceId: record.spaceId,
    title: record.title,
    parentIds: record.parentIds,
    latestPublishedVersionId: record.latestPublishedVersionId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function parseJsonBody<T>(request: Request): T | null {
  try {
    return request.postDataJSON() as T;
  } catch {
    const raw = request.postData();
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}

function cloneContent<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sseBody(deltas: string[]): string {
  const deltaEvents = deltas
    .map((delta) => `event: delta\ndata: ${JSON.stringify({ delta })}\n\n`)
    .join('');
  return `${deltaEvents}event: done\ndata: {}\n\n`;
}

async function setAuthenticatedEnglishSession(context: BrowserContext) {
  await context.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
  await context.addCookies([
    {
      name: 'ctxa_access_token',
      value: 'mock-token',
      url: APP_ORIGIN,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'knowra_locale',
      value: 'en-US',
      url: APP_ORIGIN,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

async function setupWebApiMocks(page: Page) {
  const pageRecords = new Map<string, PageRecord>(
    Object.entries(PAGE_RECORDS).map((entry) => [entry[0], { ...entry[1], content: cloneContent(entry[1].content) }]),
  );
  const pageVersionsByPageId = new Map<string, PageVersionRecord[]>();

  const buildPublishedVersion = (record: PageRecord, versionId: string): PageVersionRecord => ({
    id: versionId,
    tenantId: record.tenantId,
    pageId: record.id,
    status: 'PUBLISHED',
    title: record.title,
    content: cloneContent(record.content),
    updatedBy: USER.id,
    updatedAt: record.updatedAt,
    createdAt: record.updatedAt,
  });

  for (const record of pageRecords.values()) {
    if (!record.latestPublishedVersionId) {
      pageVersionsByPageId.set(record.id, []);
      continue;
    }
    pageVersionsByPageId.set(record.id, [buildPublishedVersion(record, record.latestPublishedVersionId)]);
  }

  await page.route(/http:\/\/(localhost|127\.0\.0\.1):3001\/.*/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method().toUpperCase();
    const pathname = url.pathname;

    const fulfillJson = async (payload: unknown, status = 200) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    };

    if (pathname === '/users/me' && method === 'GET') {
      await fulfillJson({
        ok: true,
        user: { id: USER.id },
        profile: {
          nickname: USER.nickname,
          avatarUrl: USER.avatarUrl,
          bio: 'Product marketing lead focusing on AI workflow design.',
          phone: null,
        },
        tenant: TENANT,
        memberships: [{ role: 'OWNER', tenant: TENANT }],
        verification: {
          email: { bound: true, verified: true, identifier: 'sophia.carter@knowra.ai' },
          phone: { bound: false, verified: false, identifier: null },
          password: { set: true },
        },
      });
      return;
    }

    if (pathname === '/auth/switch-tenant' && method === 'POST') {
      await fulfillJson({ ok: true, tenant: TENANT });
      return;
    }

    if (pathname === '/spaces' && method === 'GET') {
      await fulfillJson({
        items: SPACE_RECORDS.map((space) => ({
          ...space,
          createdAt: '2026-02-01T08:00:00.000Z',
          updatedAt: '2026-02-21T08:00:00.000Z',
        })),
        total: SPACE_RECORDS.length,
      });
      return;
    }

    const spacePagesTreeMatch = /^\/spaces\/([^/]+)\/pages\/tree$/.exec(pathname);
    if (spacePagesTreeMatch && method === 'GET') {
      const spaceId = decodeURIComponent(spacePagesTreeMatch[1]);
      await fulfillJson({
        items: getPagesForSpace(spaceId).map((pageRecord) => toPageDto(pageRecord, false)),
        nextCursor: null,
        hasMore: false,
      });
      return;
    }

    const spacePagesMatch = /^\/spaces\/([^/]+)\/pages$/.exec(pathname);
    if (spacePagesMatch && method === 'GET') {
      const spaceId = decodeURIComponent(spacePagesMatch[1]);
      await fulfillJson(getPagesForSpace(spaceId).map((pageRecord) => toPageDto(pageRecord, false)));
      return;
    }

    if (spacePagesMatch && method === 'POST') {
      const spaceId = decodeURIComponent(spacePagesMatch[1]);
      const payload = parseJsonBody<{ title?: string; content?: unknown[] }>(request);
      const createdAt = nowIso();
      const id = `p-${Math.random().toString(36).slice(2, 8)}`;
      const next: PageRecord = {
        id,
        tenantId: TENANT.id,
        spaceId,
        title: payload?.title?.trim() || 'Untitled',
        content: Array.isArray(payload?.content) ? payload.content : [],
        parentIds: [],
        latestPublishedVersionId: null,
        createdAt,
        updatedAt: createdAt,
      };
      pageRecords.set(id, next);
      PAGE_IDS_BY_SPACE[spaceId] = [id, ...(PAGE_IDS_BY_SPACE[spaceId] ?? [])];
      await fulfillJson(toPageDto(next, true), 201);
      return;
    }

    const singlePageMatch = /^\/spaces\/([^/]+)\/pages\/([^/]+)$/.exec(pathname);
    if (singlePageMatch && method === 'GET') {
      const pageId = decodeURIComponent(singlePageMatch[2]);
      const found = pageRecords.get(pageId);
      if (!found) {
        await fulfillJson({ message: 'Not found' }, 404);
        return;
      }
      await fulfillJson(toPageDto(found, true));
      return;
    }

    if (singlePageMatch && method === 'PUT') {
      const pageId = decodeURIComponent(singlePageMatch[2]);
      const found = pageRecords.get(pageId);
      if (!found) {
        await fulfillJson({ message: 'Not found' }, 404);
        return;
      }
      const payload = parseJsonBody<{ title?: string; content?: unknown[] }>(request);
      const updated: PageRecord = {
        ...found,
        title: payload?.title?.trim() || found.title,
        content: Array.isArray(payload?.content) ? payload.content : found.content,
        updatedAt: nowIso(),
      };
      pageRecords.set(pageId, updated);
      await fulfillJson(toPageDto(updated, true));
      return;
    }

    const pageByIdMatch = /^\/pages\/([^/]+)$/.exec(pathname);
    if (pageByIdMatch && method === 'GET') {
      const pageId = decodeURIComponent(pageByIdMatch[1]);
      const found = pageRecords.get(pageId);
      if (!found) {
        await fulfillJson({ message: 'Not found' }, 404);
        return;
      }
      await fulfillJson(toPageDto(found, true));
      return;
    }

    const pageVersionsMatch = /^\/pages\/([^/]+)\/versions$/.exec(pathname);
    if (pageVersionsMatch && method === 'GET') {
      const pageId = decodeURIComponent(pageVersionsMatch[1]);
      const versions = pageVersionsByPageId.get(pageId) ?? [];
      await fulfillJson(
        versions.map((version) => ({
          id: version.id,
          tenantId: version.tenantId,
          pageId: version.pageId,
          status: version.status,
          title: version.title,
          createdAt: version.createdAt,
          updatedAt: version.updatedAt,
        })),
      );
      return;
    }

    const pageVersionDetailMatch = /^\/pages\/([^/]+)\/versions\/([^/]+)$/.exec(pathname);
    if (pageVersionDetailMatch && method === 'GET') {
      const pageId = decodeURIComponent(pageVersionDetailMatch[1]);
      const versionId = decodeURIComponent(pageVersionDetailMatch[2]);
      const versions = pageVersionsByPageId.get(pageId) ?? [];
      const found = versions.find((version) => version.id === versionId);
      if (!found) {
        await fulfillJson({ message: 'Not found' }, 404);
        return;
      }
      await fulfillJson({
        id: found.id,
        pageId: found.pageId,
        status: found.status,
        title: found.title,
        content: cloneContent(found.content),
        updatedBy: found.updatedBy,
        updatedAt: found.updatedAt,
        createdAt: found.createdAt,
      });
      return;
    }

    const publishMatch = /^\/spaces\/([^/]+)\/pages\/([^/]+)\/publish$/.exec(pathname);
    if (publishMatch && method === 'POST') {
      const pageId = decodeURIComponent(publishMatch[2]);
      const found = pageRecords.get(pageId);
      if (!found) {
        await fulfillJson({ message: 'Not found' }, 404);
        return;
      }

      const versionId = found.latestPublishedVersionId ?? `v-${pageId}`;
      const updatedAt = nowIso();
      const updatedPage: PageRecord = {
        ...found,
        latestPublishedVersionId: versionId,
        updatedAt,
      };
      pageRecords.set(pageId, updatedPage);

      const nextVersion = buildPublishedVersion(updatedPage, versionId);
      const existing = pageVersionsByPageId.get(pageId) ?? [];
      pageVersionsByPageId.set(pageId, [
        nextVersion,
        ...existing.filter((version) => version.id !== versionId),
      ]);

      await fulfillJson({ ok: true, versionId });
      return;
    }

    if (pathname === '/notifications/unread-count' && method === 'GET') {
      await fulfillJson({ count: 0 });
      return;
    }

    if (pathname === '/notifications' && method === 'GET') {
      await fulfillJson({ items: [], nextCursor: null, hasMore: false });
      return;
    }

    if (pathname === '/notifications/stream' && method === 'GET') {
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

    if (pathname === '/comments/threads' && method === 'GET') {
      await fulfillJson({ items: [], hasMore: false, nextCursor: null });
      return;
    }

    if (pathname === '/comments/threads/summary' && method === 'GET') {
      await fulfillJson({ all: 0, internal: 0, external: 0, open: 0, resolved: 0 });
      return;
    }

    const commentMessagesMatch = /^\/comments\/threads\/([^/]+)\/messages$/.exec(pathname);
    if (commentMessagesMatch && method === 'GET') {
      await fulfillJson({ items: [], hasMore: false, nextCursor: null });
      return;
    }

    if (pathname === '/activities/stats/daily' && method === 'GET') {
      await fulfillJson({ items: [{ date: '2026-02-21', count: 7 }] });
      return;
    }

    if (pathname === '/activities' && method === 'GET') {
      await fulfillJson({ items: [], hasMore: false, nextCursor: null });
      return;
    }

    if (pathname === '/daily-copies/today' && method === 'GET') {
      await fulfillJson({
        item: {
          id: 'dc-1',
          date: '2026-02-21',
          content: 'Turn each answer into reusable knowledge.',
          metadata: { liked: false },
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      });
      return;
    }

    if (method === 'GET') {
      await fulfillJson({ ok: true, items: [], hasMore: false, nextCursor: null });
      return;
    }

    await fulfillJson({ ok: true });
  });
}

async function setupKnowraAiMocks(page: Page) {
  const sourceConfigByConversationId = buildDefaultSourceMap();

  await page.route(/http:\/\/(localhost|127\.0\.0\.1):3002\/.*/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method().toUpperCase();
    const pathname = url.pathname;

    const fulfillJson = async (payload: unknown, status = 200) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    };

    const fulfillSse = async (payload: string) => {
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache, no-transform',
          connection: 'keep-alive',
        },
        body: payload,
      });
    };

    if (pathname === '/api/conversations' && method === 'GET') {
      await fulfillJson(AI_CONVERSATIONS);
      return;
    }

    if (pathname === '/api/conversations' && method === 'POST') {
      const payload = parseJsonBody<{ title?: string }>(request);
      const created = {
        id: 'c-new-capture',
        title: payload?.title?.trim() || 'New chat',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      await fulfillJson(created, 201);
      return;
    }

    const messageMatch = /^\/api\/conversations\/([^/]+)\/messages$/.exec(pathname);
    if (messageMatch && method === 'GET') {
      const conversationId = decodeURIComponent(messageMatch[1]);
      await fulfillJson(AI_MESSAGES[conversationId] ?? []);
      return;
    }

    const sourceMatch = /^\/api\/conversations\/([^/]+)\/sources$/.exec(pathname);
    if (sourceMatch && method === 'GET') {
      const conversationId = decodeURIComponent(sourceMatch[1]);
      const config = sourceConfigByConversationId.get(conversationId) ?? {
        internetEnabled: true,
        spaceEnabled: true,
        spaceIds: [],
        carryContext: true,
      };
      await fulfillJson(cloneSourceConfig(config));
      return;
    }

    if (sourceMatch && method === 'POST') {
      const conversationId = decodeURIComponent(sourceMatch[1]);
      const payload = parseJsonBody<Partial<SourceConfig>>(request);
      const next: SourceConfig = {
        internetEnabled: Boolean(payload?.internetEnabled),
        spaceEnabled: Boolean(payload?.spaceEnabled),
        spaceIds: Array.isArray(payload?.spaceIds)
          ? payload.spaceIds.map((id) => String(id)).filter(Boolean)
          : [],
        carryContext: payload?.carryContext === undefined ? true : Boolean(payload.carryContext),
      };
      sourceConfigByConversationId.set(conversationId, next);
      await fulfillJson(cloneSourceConfig(next));
      return;
    }

    const renameMatch = /^\/api\/conversations\/([^/]+)\/rename$/.exec(pathname);
    if (renameMatch && method === 'POST') {
      const conversationId = decodeURIComponent(renameMatch[1]);
      const payload = parseJsonBody<{ title?: string }>(request);
      const found = AI_CONVERSATIONS.find((conversation) => conversation.id === conversationId);
      await fulfillJson({
        id: conversationId,
        title: payload?.title?.trim() || found?.title || 'Untitled conversation',
        createdAt: found?.createdAt ?? nowIso(),
        updatedAt: nowIso(),
      });
      return;
    }

    const deleteMatch = /^\/api\/conversations\/([^/]+)$/.exec(pathname);
    if (deleteMatch && method === 'DELETE') {
      await fulfillJson({ ok: true });
      return;
    }

    if (pathname === '/api/chat/stream' && method === 'POST') {
      const payload = parseJsonBody<{ message?: string }>(request);
      const question = payload?.message?.trim() || 'Question';
      const answer = [
        `Answering: ${question}`,
        'Suggested next step: save this response into your launch document for team review.',
      ];
      await fulfillSse(sseBody(answer));
      return;
    }

    if (pathname === '/api/inline-actions/stream' && method === 'POST') {
      const payload = parseJsonBody<{ actionType?: string; selectedText?: string }>(request);
      const selectedText = payload?.selectedText?.trim() || 'Selected text';
      const actionType = payload?.actionType ?? 'custom';

      const inlineResultByAction: Record<string, string[]> = {
        expand: [
          'Expanded draft for GTM alignment:',
          `${selectedText} The message now highlights measurable business outcomes, implementation clarity, and compliance readiness for enterprise buyers.`,
        ],
        qa: [
          'Answer drafted from selected context:',
          `${selectedText} This section supports positioning, evidence, and rollout narrative in one concise response.`,
        ],
        rewrite: [
          'Rewritten draft:',
          `${selectedText} This version is structured for executive readability and call-to-action clarity.`,
        ],
        summarize: [
          'Summary:',
          'Knowra turns AI output into durable, shareable knowledge assets for teams.',
        ],
        custom: [
          'Custom response:',
          `${selectedText} Consider adding quantified proof points before publishing.`,
        ],
      };

      const lines = inlineResultByAction[actionType] ?? inlineResultByAction.custom;
      await fulfillSse(sseBody(lines));
      return;
    }

    if (pathname === '/api/attachments' && method === 'POST') {
      await fulfillJson({
        ok: true,
        attachments: [
          {
            id: 'att-1',
            name: 'launch-notes.pdf',
            size: 43120,
            mimeType: 'application/pdf',
            chunkCount: 3,
          },
        ],
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

async function captureKnowraAiQuestionWithInternetOnly(page: Page) {
  await page.goto('/knowra-ai');
  await expect(page.getByText('EU AI Launch Risks (Internet Only)').first()).toBeVisible();
  await expect(
    page.getByText('What are the top three regulatory risks for launching an AI note-taking product in the EU in 2026'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Source settings' }).click();
  const sourceMenu = page.locator('[role=\"menu\"]').last();
  await expect(sourceMenu.getByText('Carry context', { exact: true })).toBeVisible();
  await expect(sourceMenu.getByText('Internet', { exact: true })).toBeVisible();
  await expect(sourceMenu.getByText('Spaces', { exact: true })).toBeVisible();

  await page.screenshot({ path: path.join(OUTPUT_DIR, SCENE_FILES.aiQuestionInternet), fullPage: true });
}

async function captureKnowraAiInsertPanel(page: Page) {
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Insert to Doc' }).click();
  const spaceMenuItem = page.getByRole('menuitem', { name: 'Product Strategy Hub' });
  await expect(spaceMenuItem).toBeVisible();
  await spaceMenuItem.hover();
  await expect(page.getByRole('menuitem', { name: 'New Document' })).toBeVisible();

  await page.screenshot({ path: path.join(OUTPUT_DIR, SCENE_FILES.aiInsertPanel), fullPage: true });
}

async function focusEditorSelection(
  page: Page,
  mode: 'edit' | 'preview',
) {
  const pageUrl =
    mode === 'edit'
      ? '/spaces/s-product/pages/p-launch-plan?mode=edit'
      : '/spaces/s-product/pages/p-launch-plan';
  await page.goto(pageUrl);

  if (mode === 'edit') {
    await expect(page.getByRole('button', { name: 'Publish' })).toBeVisible();
  } else {
    await expect(page.getByRole('button', { name: /Edit|编辑/ })).toBeVisible();
  }

  const paragraphText =
    'Knowra captures meeting notes and transforms them into reusable launch docs for cross-functional teams.';
  const paragraph = page.locator('p').filter({ hasText: paragraphText }).first();
  await expect(paragraph).toBeVisible({ timeout: 12000 });
  await paragraph.click({ clickCount: 2 });

  const inlineToolbarSelector =
    mode === 'edit'
      ? 'div.fixed.z-50.flex.items-center.gap-1'
      : 'div.fixed.z-50.flex.items-center.justify-center';
  const inlineToolbar = page.locator(inlineToolbarSelector).first();
  const opened = await inlineToolbar
    .waitFor({ state: 'visible', timeout: 2500 })
    .then(() => true)
    .catch(() => false);
  if (!opened) {
    await page.getByRole('heading', { name: 'Q2 Launch Narrative' }).first().click({ clickCount: 2 });
    await expect(inlineToolbar).toBeVisible();
  }
  return inlineToolbar;
}

async function tryOpenInlineAiPanel(page: Page, toolbar: import('@playwright/test').Locator): Promise<boolean> {
  const aiTriggerButton = toolbar.locator('button').last();
  await expect(aiTriggerButton).toBeVisible();
  await aiTriggerButton.click({ force: true });

  const panelInput = page
    .locator('input[placeholder*="Ask AI to improve this selection"],input[placeholder*="向智能助手提问"]')
    .first();
  const opened = await panelInput
    .waitFor({ state: 'visible', timeout: 3200 })
    .then(() => true)
    .catch(() => false);
  if (opened) return true;

  await aiTriggerButton.dispatchEvent('mousedown');
  await aiTriggerButton.dispatchEvent('mouseup');

  return panelInput
    .waitFor({ state: 'visible', timeout: 2200 })
    .then(() => true)
    .catch(() => false);
}

async function openInlineAiPanelWithFallback(page: Page): Promise<'edit' | 'preview'> {
  const editToolbar = await focusEditorSelection(page, 'edit');
  if (await tryOpenInlineAiPanel(page, editToolbar)) {
    return 'edit';
  }

  const previewToolbar = await focusEditorSelection(page, 'preview');
  if (await tryOpenInlineAiPanel(page, previewToolbar)) {
    return 'preview';
  }

  throw new Error('Unable to open inline AI panel in edit or preview mode');
}

async function captureEditorInlineAiToolbar(page: Page) {
  await focusEditorSelection(page, 'edit');
  await page.screenshot({ path: path.join(OUTPUT_DIR, SCENE_FILES.editorAiToolbar), fullPage: true });
}

async function captureEditorInlineAiResult(page: Page) {
  const mode = await openInlineAiPanelWithFallback(page);
  await page
    .getByRole('button', { name: mode === 'edit' ? /Expand|扩写/ : /Q&A|问答/ })
    .click();

  const expectedHeadline =
    mode === 'edit' ? 'Expanded draft for GTM alignment:' : 'Answer drafted from selected context:';
  await expect(page.getByText(expectedHeadline).first()).toBeVisible();
  await page.screenshot({ path: path.join(OUTPUT_DIR, SCENE_FILES.editorAiResult), fullPage: true });
}

async function captureKnowraAiSearchAllKnowledge(page: Page) {
  await page.goto('/knowra-ai');
  await page.getByRole('button', { name: 'Security Objections from All Spaces' }).click();
  await expect(page.getByText('Across all knowledge bases, summarize recurring enterprise security objections')).toBeVisible();

  await page.getByRole('button', { name: 'Source settings' }).click();
  const sourceMenu = page.locator('[role=\"menu\"]').last();
  await expect(sourceMenu.getByText('Spaces', { exact: true })).toBeVisible();
  await sourceMenu.getByText('Spaces', { exact: true }).hover();
  await expect(page.getByRole('menuitemcheckbox', { name: 'All spaces' })).toBeVisible();

  await page.screenshot({ path: path.join(OUTPUT_DIR, SCENE_FILES.aiSearchAllKnowledge), fullPage: true });
}

test.skip(!SHOULD_CAPTURE, 'Set PW_CAPTURE_LANDING_SCENES=1 to generate scene screenshots.');

test('capture landing scenes', async ({ page, context }) => {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await setAuthenticatedEnglishSession(context);
  await setupWebApiMocks(page);
  await setupKnowraAiMocks(page);

  await page.setViewportSize({ width: 1680, height: 1050 });

  await captureKnowraAiQuestionWithInternetOnly(page);
  await captureKnowraAiInsertPanel(page);
  await captureEditorInlineAiToolbar(page);
  await captureEditorInlineAiResult(page);
  await captureKnowraAiSearchAllKnowledge(page);
});
