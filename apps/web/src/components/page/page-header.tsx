'use client';

import { pageVersionsApi, pagesApi } from '@/lib/api';
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
  UserRoundPlusIcon,
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
import { useState } from 'react';
import { ShareModal } from '../share/share-modal';

function formatRelativeDateTime(timestamp: string | null): string | null {
  if (!timestamp) return null;

  const date = parseISO(timestamp);
  if (!isValid(date)) return null;

  if (isToday(date)) return format(date, 'HH:mm:ss');
  if (isYesterday(date)) return `昨天 ${format(date, 'HH:mm:ss')}`;

  const days = differenceInCalendarDays(new Date(), date);
  if (days === 2) return `前天 ${format(date, 'HH:mm:ss')}`;

  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

export const PageHeader = () => {
  const [shareOpen, setShareOpen] = useState(false);
  const activePage = useActivePage();
  const setPageMode = usePageContentStore((s) => s.setPageMode);
  const pageMode = usePageContentStore((s) => s.pageMode);
  const pageTitle = usePageContentStore((s) => s.pageTitle);
  const editorValue = usePageContentStore((s) => s.editorValue);
  const pageSaving = usePageContentStore((s) => s.pageSaving);
  const pagePublishing = usePageContentStore((s) => s.pagePublishing);
  const pageLoading = usePageContentStore((s) => s.pageLoading);
  const lastSavedAt = activePage?.updatedAt ?? null;
  const lastPublishedAt = usePageContentStore((s) => s.publishedSnapshot?.updatedAt ?? null);
  const timeText =
    pageMode === 'edit'
      ? formatRelativeDateTime(lastSavedAt)
      : formatRelativeDateTime(lastPublishedAt);
  const timeTitle = pageMode === 'edit' ? '已保存' : '发布于';

  const handlePublish = async () => {
    if (!activePage?.id || !activePage.spaceId) return;
    if (pageSaving || pagePublishing) return;

    const contentStore = usePageContentStore.getState();
    const normalizedTitle = pageTitle.trim() || '无标题文档';

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
      const publishedResult = await pagesApi.publish(activePage.spaceId, activePage.id);

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

      toast.success('发布成功');

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
    <div
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur"
    >
      <div className="flex items-center">
        <Button variant="link">
          {pageLoading ? '加载中…' : (activePage?.title?.trim() || '无标题文档')}
        </Button>
        {timeText ? (
          <span
            className="text-xs text-muted-foreground tabular-nums"
            title={timeTitle}
          >
            {timeTitle + ' ' + timeText}
          </span>
        ) : null}
      </div>
      <div>
        {pageMode === 'preview' ? (
          <div className="flex items-center gap-2">
            <Button
              variant="link"
              disabled={!activePage}
              onClick={() => setShareOpen(true)}
              className="gap-1"
            >
              <Share2Icon className="w-4 h-4" />
              分享
            </Button>
            <Button
              variant="link"
              disabled={!activePage}
              onClick={() => setPageMode('edit')}
              className="gap-1"
            >
              <PencilLineIcon />
              编辑
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
                title={activePage.title || '无标题文档'}
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
              <SendIcon /> 发布
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
