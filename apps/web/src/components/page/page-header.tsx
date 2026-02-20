'use client';

import { favoritesApi, pageVersionsApi, pagesApi } from '@/lib/api';
import { pageLikesApi } from '@/lib/api/page-likes';
import type { PageDto } from '@/lib/api';
import { saveDraft } from '@/lib/page/save-draft';
import {
  useActivePage,
  usePageContentStore,
  usePageStore,
  usePagesStore,
  usePageTreeStore,
} from '@/stores';
import {
  PencilLineIcon,
  SendIcon,
  Share2Icon,
  StarIcon,
  ThumbsUpIcon,
  XIcon,
} from 'lucide-react';
import {
  differenceInCalendarDays,
  format,
  isToday,
  isValid,
  isYesterday,
  parseISO,
} from 'date-fns';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { PageHeaderMoreMenu } from './page-header-more-menu';
import { useEffect, useState } from 'react';
import { ShareModal } from '../share/share-modal';
import { useI18n } from '@/lib/i18n/provider';

function formatRelativeDateTime(
  timestamp: string | null,
  yesterdayLabel: string,
  dayBeforeYesterdayLabel: string,
): string | null {
  if (!timestamp) return null;

  const date = parseISO(timestamp);
  if (!isValid(date)) return null;

  if (isToday(date)) return format(date, 'HH:mm:ss');
  if (isYesterday(date)) return `${yesterdayLabel} ${format(date, 'HH:mm:ss')}`;

  const days = differenceInCalendarDays(new Date(), date);
  if (days === 2) return `${dayBeforeYesterdayLabel} ${format(date, 'HH:mm:ss')}`;

  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

function formatCompactDateTime(
  timestamp: string | null,
  yesterdayLabel: string,
): string | null {
  if (!timestamp) return null;

  const date = parseISO(timestamp);
  if (!isValid(date)) return null;

  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return `${yesterdayLabel} ${format(date, 'HH:mm')}`;

  return format(date, 'MM-dd HH:mm');
}

export const PageHeader = () => {
  const { t } = useI18n();
  const [hydrated, setHydrated] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const activePage = useActivePage();
  const setPageMode = usePageContentStore((s) => s.setPageMode);
  const pageMode = usePageContentStore((s) => s.pageMode);
  const pageTitle = usePageContentStore((s) => s.pageTitle);
  const editorValue = usePageContentStore((s) => s.editorValue);
  const pageSaving = usePageContentStore((s) => s.pageSaving);
  const pagePublishing = usePageContentStore((s) => s.pagePublishing);
  const pageLoading = usePageContentStore((s) => s.pageLoading);
  const lastSavedAt = activePage?.updatedAt ?? null;
  const lastPublishedAt = usePageContentStore(
    (s) => s.publishedSnapshot?.updatedAt ?? null,
  );
  const timeText =
    hydrated
      ? pageMode === 'edit'
        ? formatRelativeDateTime(
            lastSavedAt,
            t('pageHeader.yesterday'),
            t('pageHeader.dayBeforeYesterday'),
          )
        : formatRelativeDateTime(
            lastPublishedAt,
            t('pageHeader.yesterday'),
            t('pageHeader.dayBeforeYesterday'),
          )
      : null;
  const compactTimeText =
    hydrated
      ? pageMode === 'edit'
        ? formatCompactDateTime(lastSavedAt, t('pageHeader.yesterday'))
        : formatCompactDateTime(lastPublishedAt, t('pageHeader.yesterday'))
      : null;
  const timeTitle =
    pageMode === 'edit' ? t('pageHeader.saved') : t('pageHeader.publishedAt');
  const compactTimeTitle =
    pageMode === 'edit' ? t('pageHeader.saved') : t('pageHeader.published');

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!activePage?.id) {
      setFavorite(false);
      setFavoriteLoading(false);
      return;
    }

    let canceled = false;
    setFavoriteLoading(true);

    favoritesApi
      .getStatus({ targetType: 'PAGE', targetId: activePage.id })
      .then((result) => {
        if (canceled) return;
        setFavorite(Boolean(result.favorite));
      })
      .catch(() => {
        if (canceled) return;
        setFavorite(false);
      })
      .finally(() => {
        if (canceled) return;
        setFavoriteLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [activePage?.id]);

  useEffect(() => {
    if (!activePage?.id || !activePage?.spaceId) {
      setLiked(false);
      setLikeCount(0);
      setLikeLoading(false);
      return;
    }

    let canceled = false;
    setLikeLoading(true);

    pageLikesApi
      .getSummary({ spaceId: activePage.spaceId, pageId: activePage.id })
      .then((result) => {
        if (canceled) return;
        setLiked(Boolean(result.liked));
        setLikeCount(Math.max(0, Number(result.likeCount) || 0));
      })
      .catch(() => {
        if (canceled) return;
        setLiked(false);
        setLikeCount(0);
      })
      .finally(() => {
        if (canceled) return;
        setLikeLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [activePage?.id, activePage?.spaceId]);

  const handleToggleFavorite = async () => {
    if (!activePage?.id) return;
    if (favoriteLoading) return;

    const nextFavorite = !favorite;
    setFavorite(nextFavorite);
    setFavoriteLoading(true);

    try {
      await favoritesApi.set({
        targetType: 'PAGE',
        targetId: activePage.id,
        favorite: nextFavorite,
        extraData: {
          spaceId: activePage.spaceId ?? null,
        },
      });
      toast.success(
        nextFavorite
          ? t('pageHeader.pageFavorited')
          : t('pageHeader.pageUnfavorited'),
      );
    } catch {
      setFavorite(!nextFavorite);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!activePage?.id || !activePage.spaceId) return;
    if (likeLoading) return;

    const previousCount = likeCount;
    const nextLiked = !liked;
    const nextCount = Math.max(0, previousCount + (nextLiked ? 1 : -1));

    setLiked(nextLiked);
    setLikeCount(nextCount);
    setLikeLoading(true);

    try {
      const result = await pageLikesApi.setLike({
        spaceId: activePage.spaceId,
        pageId: activePage.id,
        liked: nextLiked,
      });
      setLiked(Boolean(result.liked));
      setLikeCount(Math.max(0, Number(result.likeCount) || 0));
      toast.success(nextLiked ? t('pageHeader.pageLiked') : t('pageHeader.pageUnliked'));
    } catch {
      setLiked(!nextLiked);
      setLikeCount(previousCount);
    } finally {
      setLikeLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!activePage?.id || !activePage.spaceId) return;
    if (pageSaving || pagePublishing) return;

    const contentStore = usePageContentStore.getState();
    const normalizedTitle = pageTitle.trim() || t('pageHeader.untitledDoc');

    let saved: PageDto | null = null;

    try {
      contentStore.setPageSaving(true);
      saved = await saveDraft({
        spaceId: activePage.spaceId,
        pageId: activePage.id,
        title: normalizedTitle,
        content: editorValue,
      });
    } finally {
      contentStore.setPageSaving(false);
    }

    if (!saved) return;

    try {
      contentStore.setPagePublishing(true);
      const publishedResult = await pagesApi.publish(
        activePage.spaceId,
        activePage.id,
      );

      const nextPage = {
        ...saved,
        latestPublishedVersionId: publishedResult.versionId,
      };
      usePageStore.getState().patchPage(nextPage);
      usePagesStore.getState().upsertPage(saved.spaceId, nextPage);
      usePagesStore.getState().upsertTreePage(saved.spaceId, nextPage);
      usePageTreeStore.getState().updateNode(saved.id, {
        data: nextPage,
      });

      toast.success(t('pageHeader.publishSuccess'));

      try {
        const published = await pageVersionsApi.getVersion(
          activePage.id,
          nextPage.latestPublishedVersionId,
        );
        contentStore.setPublishedSnapshot({
          title: published.title,
          content: published.content,
          updatedBy: published.updatedBy,
          updatedAt: published.updatedAt,
        });

        usePageTreeStore.getState().updateNode(activePage.id, {
          label: published.title,
        });
      } catch {
        // Ignore: publish succeeded, snapshot refresh is optional.
      }
    } finally {
      contentStore.setPagePublishing(false);
    }

    contentStore.setPageMode('preview');
  };

  return (
    <div className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur md:h-14 md:gap-3 md:px-4 md:py-0">
      <div className="min-w-0 flex-1">
        <Button
          variant="link"
          className="h-auto max-w-full justify-start p-0 text-base text-foreground"
        >
          {pageLoading
            ? t('common.loading')
            : activePage?.title?.trim() || t('pageHeader.untitledDoc')}
        </Button>
        {compactTimeText ? (
          <span
            className="block text-[11px] text-muted-foreground tabular-nums md:hidden"
            title={timeTitle + ' ' + timeText}
          >
            {compactTimeTitle + ' ' + compactTimeText}
          </span>
        ) : null}
        {timeText ? (
          <span
            className="hidden whitespace-nowrap text-xs text-muted-foreground tabular-nums md:ml-2 md:inline"
            title={timeTitle}
          >
            {timeTitle + ' ' + timeText}
          </span>
        ) : null}
      </div>
      <div className="shrink-0">
        {pageMode === 'preview' ? (
          <div className="flex items-center gap-0.5 text-primary/70 md:gap-1">
            <Button
              variant="ghost"
              className="h-8 gap-1 px-2"
              disabled={!activePage || likeLoading}
              onClick={handleToggleLike}
              title={liked ? t('pageHeader.unlikePage') : t('pageHeader.likePage')}
            >
              <ThumbsUpIcon
                className={`h-4 w-4 ${liked ? 'fill-current text-blue-500' : ''}`}
              />
              <span className="text-xs tabular-nums">{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!activePage || favoriteLoading}
              onClick={handleToggleFavorite}
              title={
                favorite
                  ? t('pageHeader.unfavoritePage')
                  : t('pageHeader.favoritePage')
              }
            >
              <StarIcon
                className={`h-4 w-4 ${favorite ? 'fill-current text-amber-500' : ''}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!activePage}
              onClick={() => setShareOpen(true)}
            >
              <Share2Icon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              disabled={!activePage}
              onClick={() => setPageMode('edit')}
              title={t('pageHeader.edit')}
            >
              <PencilLineIcon />
            </Button>
            <Button
              variant="ghost"
              className="hidden md:inline-flex"
              disabled={!activePage}
              onClick={() => setPageMode('edit')}
            >
              <PencilLineIcon />
              {t('pageHeader.edit')}
            </Button>
            <PageHeaderMoreMenu
              pageId={activePage?.id ?? null}
              spaceId={activePage?.spaceId ?? null}
              title={activePage?.title ?? pageTitle ?? null}
            />
            {activePage && (
              <ShareModal
                open={shareOpen}
                onOpenChange={setShareOpen}
                targetId={activePage.id}
                type="PAGE"
                title={activePage.title || t('pageHeader.untitledDoc')}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePublish}
              className="gap-1"
              disabled={!activePage || pageSaving || pagePublishing}
            >
              <SendIcon /> {t('pageHeader.publish')}
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button
              variant="ghost"
              onClick={() => setPageMode('preview')}
              size="icon"
              disabled={pageSaving || pagePublishing}
            >
              <XIcon />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
