'use client';

import { formatDistanceToNow } from 'date-fns';
import { Trash2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InboxNotification } from './types';

type NotificationItemProps = {
  item: InboxNotification;
  onClick: (item: InboxNotification) => void;
  onDelete: (item: InboxNotification) => void;
};

function formatTime(raw: string): string {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function NotificationItem({ item, onClick, onDelete }: NotificationItemProps) {
  return (
    <div
      className={cn(
        'group relative border-b p-3 transition-colors hover:bg-muted/40',
        !item.isRead && 'bg-blue-50/40 dark:bg-blue-950/20',
      )}
    >
      <button
        type="button"
        className="w-full text-left"
        onClick={() => onClick(item)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {item.type}
              </span>
              {!item.isRead && <span className="h-2 w-2 rounded-full bg-blue-500" />}
            </div>
            <div className="truncate text-sm font-medium">{item.title}</div>
            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {item.body}
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              {formatTime(item.createdAt)}
            </div>
          </div>
        </div>
      </button>

      <button
        type="button"
        className="absolute right-2 top-2 hidden rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground group-hover:block"
        onClick={() => onDelete(item)}
        aria-label="delete notification"
      >
        <Trash2Icon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
