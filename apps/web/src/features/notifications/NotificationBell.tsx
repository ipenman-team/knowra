'use client';

import { useMemo, useState } from 'react';
import { BellIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useNotificationUnreadCount } from '@/stores';
import { useNotificationSSE } from './hooks/use-notification-sse';
import { NotificationPanel } from './NotificationPanel';

function formatBadge(n: number): string {
  if (n > 99) return '99+';
  return String(n);
}

export function NotificationBell() {
  const { isMobile } = useSidebar();
  const unreadCount = useNotificationUnreadCount();
  const [open, setOpen] = useState(false);

  useNotificationSSE();

  const badgeText = useMemo(() => formatBadge(unreadCount), [unreadCount]);

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-8 w-8 rounded-full"
      aria-label="notifications"
      onClick={() => setOpen((prev) => !prev)}
    >
      <BellIcon className="h-4 w-4" />
      {unreadCount > 0 && (
        <span
          className={cn(
            'absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-medium leading-4 text-white',
          )}
        >
          {badgeText}
        </span>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <NotificationPanel open={open} onClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0" sideOffset={8}>
        <NotificationPanel open={open} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
