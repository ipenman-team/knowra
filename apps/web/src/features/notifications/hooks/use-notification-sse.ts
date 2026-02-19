'use client';

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { notificationsApi } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/api/client';
import { useMeLoaded, useMeStore } from '@/stores';
import { useNotificationStore } from '@/stores';
import type { NotificationEventPayload } from '../types';

type UseNotificationSSEOptions = {
  onNotification?: (payload: NotificationEventPayload) => void;
};

type BroadcastPayload = {
  sourceId: string;
  type: 'sync';
  count: number;
};

function parseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function useNotificationSSE(options?: UseNotificationSSEOptions) {
  const loaded = useMeLoaded();
  const user = useMeStore((s) => s.user);
  const syncUnreadCount = useNotificationStore((s) => s.syncUnreadCount);
  const incrementUnread = useNotificationStore((s) => s.incrementUnread);

  const sourceIdRef = useRef('tab-default');
  const eventSourceRef = useRef<EventSource | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      sourceIdRef.current = `tab-${crypto.randomUUID()}`;
      return;
    }
    sourceIdRef.current = `tab-${Date.now()}`;
  }, []);

  const syncUnreadCountFromServer = useCallback(async () => {
    try {
      const result = await notificationsApi.unreadCount();
      syncUnreadCount(result.count);
      channelRef.current?.postMessage({
        sourceId: sourceIdRef.current,
        type: 'sync',
        count: result.count,
      } satisfies BroadcastPayload);
    } catch {
      // ignore network error
    }
  }, [syncUnreadCount]);

  const closeConnection = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  const openConnection = useCallback(() => {
    if (!loaded || !user?.id) return;
    if (typeof window === 'undefined') return;
    if (eventSourceRef.current) return;

    const es = new EventSource(`${getApiBaseUrl()}/notifications/stream`, {
      withCredentials: true,
    });

    es.addEventListener('notification', (event) => {
      const payload = parseJson<NotificationEventPayload>((event as MessageEvent).data);
      if (!payload) return;

      incrementUnread();
      options?.onNotification?.(payload);

      toast(payload.title, {
        description: payload.body,
        duration: 5000,
        action: payload.link
          ? {
              label: '查看',
              onClick: () => {
                if (!payload.link) return;
                window.location.assign(payload.link);
              },
            }
          : undefined,
      });
    });

    es.addEventListener('unread_count_sync', (event) => {
      const payload = parseJson<{ count: number }>((event as MessageEvent).data);
      if (!payload) return;

      syncUnreadCount(payload.count);
      channelRef.current?.postMessage({
        sourceId: sourceIdRef.current,
        type: 'sync',
        count: payload.count,
      } satisfies BroadcastPayload);
    });

    es.onopen = () => {
      void syncUnreadCountFromServer();
    };

    es.onerror = () => {
      // EventSource has built-in retry; keep connection object.
    };

    eventSourceRef.current = es;
  }, [incrementUnread, loaded, options, syncUnreadCount, syncUnreadCountFromServer, user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('notifications');
    channel.onmessage = (event: MessageEvent<BroadcastPayload>) => {
      const payload = event.data;
      if (!payload || payload.sourceId === sourceIdRef.current) return;
      if (payload.type === 'sync') {
        syncUnreadCount(payload.count);
      }
    };

    channelRef.current = channel;
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [syncUnreadCount]);

  useEffect(() => {
    if (!loaded || !user?.id) {
      closeConnection();
      return;
    }

    openConnection();
    void syncUnreadCountFromServer();

    return () => {
      closeConnection();
    };
  }, [closeConnection, loaded, openConnection, syncUnreadCountFromServer, user?.id]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        closeConnection();
        return;
      }
      openConnection();
      void syncUnreadCountFromServer();
    };

    const onOnline = () => {
      openConnection();
      void syncUnreadCountFromServer();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
    };
  }, [closeConnection, openConnection, syncUnreadCountFromServer]);
}
