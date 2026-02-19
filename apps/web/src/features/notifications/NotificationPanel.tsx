'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useNotificationUnreadCount } from '@/stores';
import { useNotifications } from './hooks/use-notifications';
import { NotificationItem } from './NotificationItem';
import type { InboxNotification } from './types';

type NotificationPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const unreadCount = useNotificationUnreadCount();
  const {
    items,
    loading,
    loadingMore,
    hasMore,
    loadInitial,
    loadMore,
    markRead,
    markAllRead,
    remove,
  } = useNotifications();

  useEffect(() => {
    if (!open) return;
    void loadInitial();
  }, [loadInitial, open]);

  const handleClickItem = useCallback(
    async (item: InboxNotification) => {
      if (!item.isRead) {
        await markRead(item.id);
      }

      if (item.link) {
        router.push(item.link);
      }
      onClose();
    },
    [markRead, onClose, router],
  );

  const handleDeleteItem = useCallback(
    async (item: InboxNotification) => {
      await remove(item.id);
    },
    [remove],
  );

  return (
    <div className="flex h-full max-h-[70vh] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm font-semibold">通知</div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => void markAllRead()}
            disabled={unreadCount <= 0}
          >
            全部已读
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">加载中...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">暂无通知</div>
        ) : (
          items.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onClick={(value) => void handleClickItem(value)}
              onDelete={(value) => void handleDeleteItem(value)}
            />
          ))
        )}
      </div>

      {hasMore && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => void loadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? '加载中...' : '加载更多'}
          </Button>
        </div>
      )}
    </div>
  );
}
