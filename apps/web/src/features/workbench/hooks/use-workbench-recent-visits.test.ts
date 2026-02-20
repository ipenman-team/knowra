import { describe, expect, it } from 'vitest';
import type { ActivityItem } from '@knowra/shared';

import { buildRecentVisitItems } from './use-workbench-recent-visits';

function makeActivity(input: {
  id: string;
  pageId: string;
  createdAt: string;
  spaceId?: string;
  title?: string;
}): ActivityItem {
  return {
    id: input.id,
    action: 'page.view',
    actionName: '访问页面',
    content: input.title ?? null,
    ActivityItem: '',
    subjectType: 'page',
    subjectId: input.pageId,
    actorUserId: 'u1',
    createdAt: input.createdAt,
    metadata: {
      spaceId: input.spaceId ?? 's1',
      title: input.title ?? '',
    },
    ip: null,
    userAgent: null,
  };
}

describe('buildRecentVisitItems', () => {
  it('keeps only the newest visit per page and respects limit', () => {
    const items: ActivityItem[] = [];

    for (let i = 0; i < 25; i += 1) {
      items.push(
        makeActivity({
          id: `a-${i}`,
          pageId: `p-${i}`,
          createdAt: `2026-02-20T10:${String(i).padStart(2, '0')}:00.000Z`,
          spaceId: `s-${i}`,
          title: `Page ${i}`,
        }),
      );
    }

    items.unshift(
      makeActivity({
        id: 'a-repeat',
        pageId: 'p-3',
        createdAt: '2026-02-20T11:00:00.000Z',
        spaceId: 's-3',
        title: 'Page 3 latest',
      }),
    );

    const result = buildRecentVisitItems(items, 20);
    expect(result).toHaveLength(20);
    expect(result[0]).toMatchObject({
      pageId: 'p-3',
      title: 'Page 3 latest',
    });
    expect(result.filter((item) => item.pageId === 'p-3')).toHaveLength(1);
  });
});
