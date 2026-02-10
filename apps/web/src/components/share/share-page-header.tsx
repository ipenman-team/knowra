'use client';

import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ShareDto } from '@/lib/api';

interface SharePageHeaderProps {
  title?: string;
  publishedAt?: string | Date;
}

export function SharePageHeader({ title, publishedAt }: SharePageHeaderProps) {
  const formattedDate = publishedAt 
    ? format(new Date(publishedAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
    : '';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium truncate max-w-[200px]">{title || '无标题文档'}</span>
          {formattedDate && (
            <span className="text-muted-foreground text-xs">
              发布于 {formattedDate}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Right side area - explicitly empty as requested */}
        </div>
      </div>
    </header>
  );
}
