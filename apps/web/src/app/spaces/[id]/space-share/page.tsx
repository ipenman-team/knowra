'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { CopyIcon, ExternalLinkIcon, Loader2 } from 'lucide-react';
import { sharesApi, ShareDto, spacesApi, pagesApi } from '@/lib/api';
import { pageVersionsApi } from '@/lib/api/page-versions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type {
  SpaceShareSnapshotPage,
  SpaceShareSnapshotPayload,
} from '@/components/share/types';
import { toast } from 'sonner';

type AccessMode = 'public' | 'password';
type ExpirePreset = 'never' | '7d' | '30d';

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_BATCH_SIZE = 200;
const PAGE_FETCH_LIMIT = 1000;

function expirePresetFromDate(expiresAt?: string | null): ExpirePreset {
  if (!expiresAt) return 'never';
  const ts = new Date(expiresAt).getTime();
  if (!Number.isFinite(ts)) return 'never';

  const diffDays = Math.round((ts - Date.now()) / DAY_MS);
  if (diffDays >= 6 && diffDays <= 8) return '7d';
  if (diffDays >= 29 && diffDays <= 31) return '30d';
  return 'never';
}

function dateFromExpirePreset(preset: ExpirePreset): string | null {
  if (preset === 'never') return null;
  const days = preset === '7d' ? 7 : 30;
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

function modeFromShare(share: ShareDto): AccessMode {
  return share.visibility === 'RESTRICTED' ? 'password' : 'public';
}

async function listSpacePagesForSnapshot(spaceId: string) {
  const pages: Array<{
    id: string;
    title: string;
    parentIds: string[];
    latestPublishedVersionId?: string | null;
    updatedAt: string;
  }> = [];

  let skip = 0;
  while (skip < PAGE_FETCH_LIMIT) {
    const batch = await pagesApi.list(spaceId, {
      skip,
      take: PAGE_BATCH_SIZE,
    });
    if (!batch.length) break;

    pages.push(
      ...batch.map((item) => ({
        id: item.id,
        title: item.title,
        parentIds: item.parentIds ?? [],
        latestPublishedVersionId: item.latestPublishedVersionId ?? null,
        updatedAt: item.updatedAt,
      })),
    );

    if (batch.length < PAGE_BATCH_SIZE) break;
    skip += batch.length;
  }

  return pages;
}

export default function SpaceSharePage() {
  const params = useParams();
  const spaceId = params.id as string;

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
    fetchShare();
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
    } catch (error: any) {
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

  const handleRegenerateShare = useCallback(async () => {
    if (!share) return;
    setSubmitting(true);
    try {
      const createdShare = await createShareWithSnapshot(share.id);
      setShare(createdShare);
      setPasswordInput('');
      toast.success('共享设置已更新，链接已重新生成');
      await fetchShare();
    } catch (error: any) {
      console.error(error);
      if (error instanceof Error && error.message === 'password_required') {
        toast.error('密码模式下请输入访问密码');
      } else {
        toast.error('更新空间共享设置失败');
      }
    } finally {
      setSubmitting(false);
    }
  }, [createShareWithSnapshot, fetchShare, share]);

  const handleRefreshSnapshot = useCallback(async () => {
    if (!share) return;
    setSubmitting(true);
    try {
      const payload = await buildSnapshotPayload();
      await sharesApi.createSnapshot(share.id, payload);
      toast.success('共享内容已刷新');
    } catch (error) {
      console.error(error);
      toast.error('刷新共享内容失败');
    } finally {
      setSubmitting(false);
    }
  }, [buildSnapshotPayload, share]);

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

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-14 shrink-0 items-center border-b px-6">
        <h1 className="text-lg font-semibold">空间共享</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card className="max-w-3xl border-none shadow-none">
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 pt-4">
                <Label>开启空间共享</Label>
                <p className="text-sm text-muted-foreground">
                  {share
                    ? '当前已开启，可复制链接发送给外部用户。'
                    : '当前仅空间成员可见。'}
                </p>
              </div>
              <Switch
                checked={Boolean(share)}
                onCheckedChange={handleToggleShare}
                disabled={loading || submitting}
              />
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在加载共享配置...
              </div>
            ) : null}
            {share && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>访问方式</Label>
                    <Select
                      value={accessMode}
                      onValueChange={(value: AccessMode) =>
                        setAccessMode(value)
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择访问方式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">公开访问</SelectItem>
                        <SelectItem value="password">密码访问</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>有效期</Label>
                    <Select
                      value={expirePreset}
                      onValueChange={(value: ExpirePreset) =>
                        setExpirePreset(value)
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择有效期" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">永久有效</SelectItem>
                        <SelectItem value="7d">7 天有效</SelectItem>
                        <SelectItem value="30d">30 天有效</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {accessMode === 'password' ? (
                  <div className="space-y-2">
                    <Label>访问密码</Label>
                    <Input
                      type="text"
                      placeholder="请输入访问密码（更新设置时生效）"
                      value={passwordInput}
                      onChange={(event) => setPasswordInput(event.target.value)}
                      disabled={submitting}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>共享链接</Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="min-w-[240px] flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                      aria-label="复制链接"
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={handleOpenLink}>
                      <ExternalLinkIcon className="mr-2 h-4 w-4" />
                      新窗口打开
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {share.expiresAt
                      ? `链接有效期至 ${new Date(share.expiresAt).toLocaleString()}`
                      : '链接永久有效，直到你手动关闭共享。'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
