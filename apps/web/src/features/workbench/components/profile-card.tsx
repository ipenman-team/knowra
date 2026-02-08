'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Separator } from '@/components/ui/separator';
import { DailyCopyWidget } from './daily-copy-widget';

type ProfileCardProps = {
  name: string;
  greeting: string;
  todayCount: number;
  updatedAt: Date;
  avatarUrl?: string;
  loading?: boolean;
  error?: string | null;
};

export function ProfileCard({
  name,
  greeting,
  todayCount,
  updatedAt,
  avatarUrl,
  loading,
  error,
}: ProfileCardProps) {
  const fallback = name?.trim().slice(0, 1) || 'U';
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const weekLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekdayLabel = weekLabels[now.getDay()] ?? '周日';
  const dateLabel = format(now, 'yyyy年M月d日');
  const timeLabel = format(now, 'HH:mm:ss');

  return (
    <Card className="relative h-fit overflow-hidden border-none bg-card/90 shadow-none">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-muted/40 via-transparent to-transparent" />
      <CardContent className="space-y-4 p-6">
        <div className="text-left">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold tracking-tight text-foreground">
              {dateLabel}
            </div>
            <div className="text-xs font-medium tracking-[0.3em] text-muted-foreground">
              {weekdayLabel}
            </div>
          </div>
        </div>

        <Separator className="bg-border/70" />

        <div className="flex flex-col items-center gap-3 text-center">
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-24 w-24 border shadow-sm transition-transform duration-300 hover:scale-[1.02]">
                  <AvatarImage src={avatarUrl ?? ''} alt={`${name} 头像`} />
                  <AvatarFallback className="text-xl">
                    {fallback}
                  </AvatarFallback>
                </Avatar>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-64">
              <div className="text-sm font-medium">
                今日动态：{loading ? '加载中…' : `${todayCount} 条`}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                最近更新时间：{format(updatedAt, 'HH:mm')}
              </div>
            </HoverCardContent>
          </HoverCard>

          <div className="text-xl font-semibold tracking-tight text-foreground">
            {greeting}，{name}
          </div>
          <div className="font-mono text-base font-medium text-muted-foreground">
            {timeLabel}
          </div>
        </div>

        <Separator className="bg-border/70" />

        <DailyCopyWidget />

        <Separator className="bg-border/70" />

        <div className="rounded-2xl border bg-muted/30 p-5 text-center shadow-sm">
          <div className="text-xs font-medium tracking-[0.25em] text-muted-foreground">
            今日活跃度
          </div>
          <div className="mt-2 text-3xl font-semibold text-foreground">
            {loading ? '—' : todayCount}
          </div>
          {error ? (
            <div className="mt-2 text-xs text-destructive">{error}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
