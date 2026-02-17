'use client';

import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { DailyCopyDto, DailyCopyMetadata } from '@contexta/shared';
import { Heart } from 'lucide-react';

import { dailyCopiesApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

type DailyCopyWidgetProps = {
  className?: string;
};

export function DailyCopyWidget({ className }: DailyCopyWidgetProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<DailyCopyDto | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const likeTimerRef = useRef<number | null>(null);

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
      setError(getErrorMessage(err, t('workbench.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!item) return;
    const metadata = item.metadata as DailyCopyMetadata | null | undefined;
    setLiked(Boolean(metadata?.liked));
  }, [item]);

  const clearLikeTimer = useCallback(() => {
    if (likeTimerRef.current) {
      window.clearTimeout(likeTimerRef.current);
      likeTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearLikeTimer, [clearLikeTimer]);

  const triggerBurst = (
    setter: (value: boolean) => void,
    timerRef: MutableRefObject<number | null>
  ) => {
    setter(false);
    window.requestAnimationFrame(() => {
      setter(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setter(false);
      }, 420);
    });
  };

  const triggerLike = () => {
    if (!item || likePending) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    triggerBurst(setLikeBurst, likeTimerRef);
    setLikePending(true);
    dailyCopiesApi
      .setLike({ liked: nextLiked })
      .then((res) => {
        setItem(res.item);
        const metadata = res.item.metadata as DailyCopyMetadata | null | undefined;
        setLiked(Boolean(metadata?.liked));
      })
      .catch(() => {
        setLiked(!nextLiked);
      })
      .finally(() => {
        setLikePending(false);
      });
  };

  return (
    <div className={cn('text-left', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium tracking-[0.3em] text-muted-foreground">
          {t('workbench.dailyQuote')}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={liked ? t('workbench.unlike') : t('workbench.like')}
            aria-pressed={liked}
            onClick={triggerLike}
            disabled={!item || likePending}
            className="relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              className={cn(
                'pointer-events-none absolute inset-0 rounded-full opacity-0',
                likeBurst &&
                  'animate-icon-halo bg-rose-400/20 shadow-[0_0_18px_rgba(244,63,94,0.45)]'
              )}
            />
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                liked ? 'text-rose-500' : 'text-muted-foreground',
                likeBurst && 'animate-icon-pop'
              )}
              strokeWidth={1.8}
              fill={liked ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      </div>

      <div className="mt-2 min-h-[44px] text-base leading-relaxed text-foreground/70">
        {loading ? t('common.loading') : item?.content ?? t('workbench.noCopyToday')}
      </div>
      {error ? <div className="mt-3 text-xs text-destructive">{error}</div> : null}
    </div>
  );
}
