'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DailyCopyCategory, DailyCopyDto } from '@contexta/shared';

import { Badge } from '@/components/ui/badge';
import { dailyCopiesApi } from '@/lib/api';

export function DailyCopyWidget() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<DailyCopyDto | null>(null);

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error) return err.message || fallback;
    if (typeof err === 'string') return err || fallback;
    return fallback;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dailyCopiesApi.getToday();
      setItem(res.item);
    } catch (err: unknown) {
      setError(getErrorMessage(err, '加载失败'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mt-3 rounded-lg bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">每日一句</div>
      </div>

      <div className="mt-2 min-h-[44px] text-sm leading-relaxed">
        {loading ? '加载中…' : item?.content ?? '今天还没有生成文案。'}
      </div>

      {error ? <div className="mt-2 text-xs text-destructive">{error}</div> : null}
    </div>
  );
}
