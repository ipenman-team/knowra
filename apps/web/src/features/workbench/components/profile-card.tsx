'use client';

import { useEffect, useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Separator } from '@/components/ui/separator';
import { DailyCopyWidget } from './daily-copy-widget';
import { useI18n } from '@/lib/i18n/provider';

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
  const { t, locale } = useI18n();
  const fallback = name?.trim().slice(0, 1) || 'U';
  const [now, setNow] = useState(() => new Date());

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [locale],
  );
  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
      }),
    [locale],
  );
  const clockFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    [locale],
  );
  const updateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [locale],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const weekdayLabel = weekdayFormatter.format(now);
  const dateLabel = dateFormatter.format(now);
  const timeLabel = clockFormatter.format(now);
  const updatedAtLabel = updateTimeFormatter.format(updatedAt);
  const todayCountText = loading
    ? t('common.loading')
    : `${todayCount} ${t('workbench.itemSuffix')}`;

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
                <Avatar className="h-24 w-24 transition-transform duration-300 hover:scale-[1.02]">
                  <AvatarImage src={avatarUrl ?? ''} alt={name} />
                  <AvatarFallback className="text-xl">
                    {fallback}
                  </AvatarFallback>
                </Avatar>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-64">
              <div className="text-sm font-medium">
                {t('workbench.todayEvents')}: {todayCountText}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t('workbench.lastUpdated')}: {updatedAtLabel}
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

        <div className="rounded-2xl bg-muted/30 p-5 text-center">
          <div className="text-xs font-medium tracking-[0.25em] text-muted-foreground">
            {t('workbench.todayActivity')}
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
