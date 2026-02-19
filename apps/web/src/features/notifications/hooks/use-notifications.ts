'use client';

import { useCallback, useState } from 'react';
import { notificationsApi } from '@/lib/api';
import { useNotificationStore } from '@/stores';
import type { InboxNotification } from '../types';

export function useNotifications() {
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const syncUnreadCount = useNotificationStore((s) => s.syncUnreadCount);
  const decrementUnread = useNotificationStore((s) => s.decrementUnread);

  const syncUnreadCountFromServer = useCallback(async () => {
    try {
      const result = await notificationsApi.unreadCount();
      syncUnreadCount(result.count);
    } catch {
      // ignore network errors
    }
  }, [syncUnreadCount]);

  const loadInitial = useCallback(
    async (force = false) => {
      if (loading && !force) return;
      if (initialized && !force) return;

      setLoading(true);
      try {
        const result = await notificationsApi.list({ limit: 20, unreadOnly: false });
        setItems(result.items);
        setNextCursor(result.nextCursor);
        setHasMore(result.hasMore);
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    },
    [initialized, loading],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const result = await notificationsApi.list({
        limit: 20,
        cursor: nextCursor,
        unreadOnly: false,
      });

      setItems((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextCursor]);

  const markRead = useCallback(
    async (id: string) => {
      let decremented = false;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id || item.isRead) return item;
          decremented = true;
          return {
            ...item,
            isRead: true,
            readAt: new Date().toISOString(),
          };
        }),
      );

      if (decremented) {
        decrementUnread(1);
      }

      try {
        await notificationsApi.markRead(id);
      } finally {
        void syncUnreadCountFromServer();
      }
    },
    [decrementUnread, syncUnreadCountFromServer],
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.isRead) return item;
        return {
          ...item,
          isRead: true,
          readAt: new Date().toISOString(),
        };
      }),
    );

    try {
      await notificationsApi.markAllRead();
    } finally {
      void syncUnreadCountFromServer();
    }
  }, [syncUnreadCountFromServer]);

  const remove = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      try {
        await notificationsApi.remove(id);
      } finally {
        void syncUnreadCountFromServer();
      }
    },
    [syncUnreadCountFromServer],
  );

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    initialized,
    loadInitial,
    loadMore,
    markRead,
    markAllRead,
    remove,
    syncUnreadCountFromServer,
  };
}
