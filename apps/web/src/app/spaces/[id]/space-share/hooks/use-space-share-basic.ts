'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { sharesApi, spacesApi, pagesApi } from '@/lib/api';
import type { ShareDto } from '@/lib/api';
import { pageVersionsApi } from '@/lib/api/page-versions';
import type {
  SpaceShareSnapshotPage,
  SpaceShareSnapshotPayload,
} from '@/components/share/types';
import { toast } from 'sonner';
import {
  dateFromExpirePreset,
  expirePresetFromDate,
  listSpacePagesForSnapshot,
  modeFromShare,
  type AccessMode,
  type ExpirePreset,
} from '../space-share.utils';

export function useSpaceShareBasic(spaceId: string) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [share, setShare] = useState<ShareDto | null>(null);
  const [accessMode, setAccessMode] = useState<AccessMode>('public');
  const [expirePreset, setExpirePreset] = useState<ExpirePreset>('never');
  const [passwordInput, setPasswordInput] = useState('');

  const shareUrl = useMemo(() => {
    if (!share || typeof window === 'undefined') return '';
    return `${window.location.origin}/share/${share.publicId}`;
  }, [share]);

  const fetchShare = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sharesApi.list({
        type: 'SPACE',
        targetId: spaceId,
        scopeType: 'SPACE',
        scopeId: spaceId,
      });

      const activeShare =
        res.items.find(
          (item) =>
            item.type === 'SPACE' &&
            item.targetId === spaceId &&
            item.status === 'ACTIVE',
        ) ?? null;

      setShare(activeShare);

      if (activeShare) {
        setAccessMode(modeFromShare(activeShare));
        setExpirePreset(expirePresetFromDate(activeShare.expiresAt ?? null));
      } else {
        setAccessMode('public');
        setExpirePreset('never');
      }
    } catch (error) {
      console.error(error);
      toast.error('获取空间共享信息失败');
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (!spaceId) return;
    void fetchShare();
  }, [fetchShare, spaceId]);

  const buildSnapshotPayload =
    useCallback(async (): Promise<SpaceShareSnapshotPayload> => {
      const [space, listedPages] = await Promise.all([
        spacesApi.get(spaceId),
        listSpacePagesForSnapshot(spaceId),
      ]);

      const pagesWithContent = await Promise.all(
        listedPages.map(
          async (page): Promise<SpaceShareSnapshotPage | null> => {
            if (page.latestPublishedVersionId) {
              try {
                const published = await pageVersionsApi.getVersion(
                  page.id,
                  page.latestPublishedVersionId,
                );
                return {
                  id: page.id,
                  title: published.title || page.title,
                  parentIds: page.parentIds,
                  content: published.content,
                  updatedAt: published.updatedAt,
                };
              } catch {
                // fallback to current page below
              }
            }

            try {
              const detail = await pagesApi.get(spaceId, page.id);
              return {
                id: detail.id,
                title: detail.title,
                parentIds: detail.parentIds ?? [],
                content: detail.content,
                updatedAt: detail.updatedAt,
              };
            } catch {
              return {
                id: page.id,
                title: page.title,
                parentIds: page.parentIds,
                content: null,
                updatedAt: page.updatedAt,
              };
            }
          },
        ),
      );

      const pages = pagesWithContent.filter(
        (item): item is SpaceShareSnapshotPage => Boolean(item),
      );

      const defaultPageId =
        pages.find((page) => page.parentIds.length === 0)?.id ??
        pages[0]?.id ??
        null;

      return {
        space: {
          id: space.id,
          name: space.name,
          description: space.description,
          color: space.color,
        },
        pages,
        defaultPageId,
      };
    }, [spaceId]);

  const createShareWithSnapshot = useCallback(
    async (replaceShareId?: string) => {
      const password = accessMode === 'password' ? passwordInput.trim() : null;

      if (accessMode === 'password' && !password) {
        throw new Error('password_required');
      }

      if (replaceShareId) {
        await sharesApi.update(replaceShareId, { status: 'REVOKED' });
      }

      let createdShare: ShareDto | null = null;

      try {
        createdShare = await sharesApi.create({
          type: 'SPACE',
          targetId: spaceId,
          visibility: accessMode === 'password' ? 'RESTRICTED' : 'PUBLIC',
          password,
          expiresAt: dateFromExpirePreset(expirePreset),
          scopeType: 'SPACE',
          scopeId: spaceId,
        });

        const payload = await buildSnapshotPayload();
        await sharesApi.createSnapshot(createdShare.id, payload);
        return createdShare;
      } catch (error) {
        if (createdShare) {
          await sharesApi
            .update(createdShare.id, { status: 'REVOKED' })
            .catch(() => null);
        }
        throw error;
      }
    },
    [accessMode, buildSnapshotPayload, expirePreset, passwordInput, spaceId],
  );

  const handleEnableShare = useCallback(async () => {
    setSubmitting(true);
    try {
      const createdShare = await createShareWithSnapshot();
      setShare(createdShare);
      setPasswordInput('');
      toast.success('空间共享已开启');
      await fetchShare();
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error && error.message === 'password_required') {
        toast.error('密码模式下请输入访问密码');
      } else {
        toast.error('开启空间共享失败');
      }
    } finally {
      setSubmitting(false);
    }
  }, [createShareWithSnapshot, fetchShare]);

  const handleDisableShare = useCallback(async () => {
    if (!share) return;
    setSubmitting(true);
    try {
      await sharesApi.update(share.id, { status: 'REVOKED' });
      setShare(null);
      toast.success('已关闭空间共享');
    } catch (error) {
      console.error(error);
      toast.error('关闭空间共享失败');
    } finally {
      setSubmitting(false);
    }
  }, [share]);

  const handleToggleShare = useCallback(
    async (checked: boolean) => {
      if (checked) {
        await handleEnableShare();
      } else {
        await handleDisableShare();
      }
    },
    [handleDisableShare, handleEnableShare],
  );

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('链接已复制');
    } catch (error) {
      console.error(error);
      toast.error('复制链接失败');
    }
  }, [shareUrl]);

  const handleOpenLink = useCallback(() => {
    if (!shareUrl) return;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }, [shareUrl]);

  return {
    loading,
    submitting,
    share,
    accessMode,
    setAccessMode,
    expirePreset,
    setExpirePreset,
    passwordInput,
    setPasswordInput,
    shareUrl,
    handleToggleShare,
    handleCopyLink,
    handleOpenLink,
  };
}
