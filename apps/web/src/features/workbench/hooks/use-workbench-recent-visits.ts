'use client';

import { useEffect, useState } from 'react';
import type { ActivityItem } from '@knowra/shared';

import { workbenchApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n/provider';

export type RecentVisitItem = {
  pageId: string;
  spaceId: string;
  spaceName?: string | null;
  title: string | null;
  visitedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function buildRecentVisitItems(
  items: ActivityItem[],
  limit = 20,
): RecentVisitItem[] {
  const visits: RecentVisitItem[] = [];
  const seenPageIds = new Set<string>();

  for (const item of items) {
    if (visits.length >= limit) break;
    if (item.subjectType !== 'page') continue;
    if (seenPageIds.has(item.subjectId)) continue;

    const metadata = isRecord(item.metadata) ? item.metadata : null;
    const spaceId = readString(metadata?.spaceId);
    if (!spaceId) continue;

    seenPageIds.add(item.subjectId);
    visits.push({
      pageId: item.subjectId,
      spaceId,
      spaceName:
        readString(metadata?.spaceName) ??
        readString(metadata?.spaceTitle) ??
        null,
      title: readString(item.content) ?? readString(metadata?.title),
      visitedAt: item.createdAt,
    });
  }

  return visits;
}

export function useWorkbenchRecentVisits(params: {
  actorUserId?: string;
  enabled?: boolean;
  limit?: number;
}) {
  const { t } = useI18n();
  const enabled = params.enabled ?? true;
  const limit = params.limit ?? 20;
  const actorUserId = params.actorUserId;
  const [items, setItems] = useState<RecentVisitItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !actorUserId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await workbenchApi.listActivities({
          actorUserId,
          action: 'page.view',
          subjectType: 'page',
          limit: 200,
        });
        if (cancelled) return;
        setItems(buildRecentVisitItems(res.items ?? [], limit));
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : t('workbench.loadFailed');
        setItems([]);
        setError(message);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorUserId, enabled, limit, t]);

  return {
    items,
    loading,
    error,
  };
}
