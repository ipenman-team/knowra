'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { CopyIcon, ExternalLinkIcon, Loader2 } from 'lucide-react';
import {
  SiteTemplateRenderer,
  type SiteTemplateRenderData,
} from '@/components/site-builder/templates';
import { pagesApi } from '@/lib/api/pages';
import type { PageDto } from '@/lib/api/pages/types';
import {
  siteBuilderApi,
  type SiteBuilderConfig,
  type SiteBuilderPageMenu,
  type SiteBuilderBlogSource,
  type SiteBuilderBlogStyle,
} from '@/lib/api/site-builder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

const PAGE_BATCH_SIZE = 200;
const PAGE_FETCH_LIMIT = 1000;

function createDefaultConfig(): SiteBuilderConfig {
  const now = new Date().toISOString();
  return {
    version: 1,
    template: 'knowledge-site',
    theme: {
      mode: 'light',
      primaryColor: '#2563eb',
    },
    menus: {
      home: { enabled: true, pageId: null },
      about: { enabled: false, pageId: null },
      blog: {
        enabled: true,
        source: 'LATEST_PUBLISHED',
        style: 'card',
        pageIds: [],
        limit: 6,
      },
      contact: { enabled: false, pageId: null },
    },
    updatedAt: now,
    updatedBy: 'current-user',
  };
}

async function listSpacePagesForPicker(spaceId: string): Promise<PageDto[]> {
  const pages: PageDto[] = [];
  let skip = 0;

  while (skip < PAGE_FETCH_LIMIT) {
    const batch = await pagesApi.list(spaceId, {
      skip,
      take: PAGE_BATCH_SIZE,
    });
    if (!batch.length) break;

    pages.push(...batch);
    if (batch.length < PAGE_BATCH_SIZE) break;
    skip += batch.length;
  }

  return pages;
}

type PreviewItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export default function SpaceSiteBuilderPage() {
  const params = useParams();
  const spaceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [config, setConfig] = useState<SiteBuilderConfig>(createDefaultConfig());
  const [pageOptions, setPageOptions] = useState<PageDto[]>([]);
  const [pageDetailMap, setPageDetailMap] = useState<Record<string, PageDto>>({});
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);

  const shareUrl = useMemo(() => {
    if (!publicId || typeof window === 'undefined') return '';
    return `${window.location.origin}/share/s/${publicId}`;
  }, [publicId]);

  const sortedPages = useMemo(() => {
    return [...pageOptions].sort((a, b) => {
      const ta = new Date(a.updatedAt).getTime();
      const tb = new Date(b.updatedAt).getTime();
      return tb - ta;
    });
  }, [pageOptions]);

  const blogPreviewItems = useMemo<PreviewItem[]>(() => {
    const blog = config.menus.blog;
    if (!blog.enabled) return [];

    if (blog.source === 'LATEST_PUBLISHED') {
      const limit = Math.min(Math.max(Number(blog.limit || 1), 1), 20);
      return sortedPages.slice(0, limit).map((page) => ({
        id: page.id,
        title: page.title,
        updatedAt: page.updatedAt,
      }));
    }

    const pageMap = new Map(sortedPages.map((page) => [page.id, page]));
    return blog.pageIds
      .map((id) => pageMap.get(id))
      .filter((page): page is PageDto => Boolean(page))
      .map((page) => ({
        id: page.id,
        title: page.title,
        updatedAt: page.updatedAt,
      }));
  }, [config.menus.blog, sortedPages]);

  const previewPageMap = useMemo<
    SiteTemplateRenderData['pageMap']
  >(() => {
    const entries = Object.values(pageDetailMap).map((page) => [
      page.id,
      {
        id: page.id,
        title: page.title,
        content: page.content ?? [],
        updatedAt: page.updatedAt,
      },
    ]);
    return Object.fromEntries(entries);
  }, [pageDetailMap]);

  const previewRenderData = useMemo<SiteTemplateRenderData>(() => {
    return {
      template: config.template,
      siteName: '站点预览',
      publishedAt,
      menus: config.menus,
      pageMap: previewPageMap,
      menuData: {
        homePageId: config.menus.home.enabled ? config.menus.home.pageId : null,
        aboutPageId: config.menus.about.enabled ? config.menus.about.pageId : null,
        contactPageId: config.menus.contact.enabled ? config.menus.contact.pageId : null,
        blog: {
          style: config.menus.blog.style,
          items: blogPreviewItems,
        },
      },
      footerText: 'Powered by Contexta',
    };
  }, [blogPreviewItems, config, previewPageMap, publishedAt]);

  const ensurePageDetail = useCallback(
    async (pageId: string | null | undefined) => {
      const id = pageId?.trim();
      if (!id) return;
      if (pageDetailMap[id]) return;

      try {
        const detail = await pagesApi.get(spaceId, id);
        setPageDetailMap((prev) => ({
          ...prev,
          [id]: detail,
        }));
      } catch (error) {
        console.error(error);
      }
    },
    [pageDetailMap, spaceId],
  );

  const loadState = useCallback(async () => {
    try {
      setLoading(true);

      const [builderState, pages] = await Promise.all([
        siteBuilderApi.get(spaceId),
        listSpacePagesForPicker(spaceId),
      ]);

      const nextConfig = builderState.draft ?? builderState.published ?? createDefaultConfig();
      setConfig(nextConfig);
      setPageOptions(pages);
      setPublishedAt(builderState.publishedAt ?? null);
      setPublicId(builderState.share?.publicId ?? null);
    } catch (error) {
      console.error(error);
      toast.error('获取展示页配置失败');
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (!spaceId) return;
    loadState();
  }, [spaceId, loadState]);

  const buildConfigForSubmit = useCallback((): SiteBuilderConfig => {
    return {
      ...config,
      updatedAt: new Date().toISOString(),
    };
  }, [config]);

  const handleSaveDraft = useCallback(async () => {
    try {
      setSaving(true);
      const saved = await siteBuilderApi.saveDraft(spaceId, buildConfigForSubmit());
      setConfig(saved);
      toast.success('草稿已保存');
    } catch (error) {
      console.error(error);
      toast.error('保存草稿失败');
    } finally {
      setSaving(false);
    }
  }, [buildConfigForSubmit, spaceId]);

  const handlePublish = useCallback(async () => {
    try {
      setPublishing(true);
      await siteBuilderApi.saveDraft(spaceId, buildConfigForSubmit());
      const published = await siteBuilderApi.publish(spaceId, { visibility: 'PUBLIC' });
      setPublicId(published.publicId);
      setPublishedAt(published.publishedAt);
      toast.success('发布成功');
    } catch (error) {
      console.error(error);
      toast.error('发布失败');
    } finally {
      setPublishing(false);
    }
  }, [buildConfigForSubmit, spaceId]);

  const handleUnpublish = useCallback(async () => {
    try {
      setPublishing(true);
      await siteBuilderApi.unpublish(spaceId);
      setPublicId(null);
      setPublishedAt(null);
      toast.success('已下线展示页');
    } catch (error) {
      console.error(error);
      toast.error('下线失败');
    } finally {
      setPublishing(false);
    }
  }, [spaceId]);

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('链接已复制');
    } catch (error) {
      console.error(error);
      toast.error('复制失败');
    }
  }, [shareUrl]);

  const handleOpenLink = useCallback(() => {
    if (!shareUrl) return;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }, [shareUrl]);

  const updatePageMenu = useCallback(
    (menu: 'home' | 'about' | 'contact', patch: Partial<SiteBuilderPageMenu>) => {
      setConfig((prev) => ({
        ...prev,
        menus: {
          ...prev.menus,
          [menu]: {
            ...prev.menus[menu],
            ...patch,
          },
        },
      }));
    },
    [],
  );

  const updateBlogMenu = useCallback(
    (patch: Partial<SiteBuilderConfig['menus']['blog']>) => {
      setConfig((prev) => ({
        ...prev,
        menus: {
          ...prev.menus,
          blog: {
            ...prev.menus.blog,
            ...patch,
          },
        },
      }));
    },
    [],
  );

  const toggleManualBlogPage = useCallback((pageId: string, checked: boolean) => {
    setConfig((prev) => {
      const exists = prev.menus.blog.pageIds.includes(pageId);
      const pageIds = checked
        ? exists
          ? prev.menus.blog.pageIds
          : [...prev.menus.blog.pageIds, pageId]
        : prev.menus.blog.pageIds.filter((id) => id !== pageId);
      return {
        ...prev,
        menus: {
          ...prev.menus,
          blog: {
            ...prev.menus.blog,
            pageIds,
          },
        },
      };
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-14 shrink-0 items-center border-b px-6">
        <h1 className="text-lg font-semibold">展示页构建（第二轮）</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 xl:grid-cols-[460px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>可视化配置</CardTitle>
              <CardDescription>
                菜单固定为 Home / About / Blog / Contact，用户只需绑定页面与展示方式。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>主题模式</Label>
                  <Select
                    value={config.theme.mode}
                    onValueChange={(value: SiteBuilderConfig['theme']['mode']) =>
                      setConfig((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, mode: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择模式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">light</SelectItem>
                      <SelectItem value="dark">dark</SelectItem>
                      <SelectItem value="system">system</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>主色</Label>
                  <Input
                    value={config.theme.primaryColor}
                    onChange={(event) =>
                      setConfig((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, primaryColor: event.target.value },
                      }))
                    }
                    placeholder="#2563eb"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-medium">Home</div>
                    <Switch
                      checked={config.menus.home.enabled}
                      onCheckedChange={(checked) => updatePageMenu('home', { enabled: checked })}
                    />
                  </div>
                  <Label className="mb-2 block">绑定页面</Label>
                  <Select
                    value={config.menus.home.pageId ?? '__none'}
                    onValueChange={(value) =>
                      updatePageMenu('home', {
                        pageId: value === '__none' ? null : value,
                      })
                    }
                    disabled={!config.menus.home.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择页面" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">不绑定</SelectItem>
                      {sortedPages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-medium">About</div>
                    <Switch
                      checked={config.menus.about.enabled}
                      onCheckedChange={(checked) => updatePageMenu('about', { enabled: checked })}
                    />
                  </div>
                  <Label className="mb-2 block">绑定页面</Label>
                  <Select
                    value={config.menus.about.pageId ?? '__none'}
                    onValueChange={(value) =>
                      updatePageMenu('about', {
                        pageId: value === '__none' ? null : value,
                      })
                    }
                    disabled={!config.menus.about.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择页面" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">不绑定</SelectItem>
                      {sortedPages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-medium">Blog</div>
                    <Switch
                      checked={config.menus.blog.enabled}
                      onCheckedChange={(checked) => updateBlogMenu({ enabled: checked })}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>数据来源</Label>
                      <Select
                        value={config.menus.blog.source}
                        onValueChange={(value: SiteBuilderBlogSource) => updateBlogMenu({ source: value })}
                        disabled={!config.menus.blog.enabled}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LATEST_PUBLISHED">最新文章</SelectItem>
                          <SelectItem value="MANUAL_PAGE_IDS">手动选择</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>列表样式</Label>
                      <Select
                        value={config.menus.blog.style}
                        onValueChange={(value: SiteBuilderBlogStyle) => updateBlogMenu({ style: value })}
                        disabled={!config.menus.blog.enabled}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="list">list</SelectItem>
                          <SelectItem value="card">card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>数量</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={config.menus.blog.limit}
                        disabled={!config.menus.blog.enabled || config.menus.blog.source !== 'LATEST_PUBLISHED'}
                        onChange={(event) => {
                          const limit = Math.max(1, Math.min(20, Number(event.target.value || 1)));
                          updateBlogMenu({ limit });
                        }}
                      />
                    </div>
                  </div>

                  {config.menus.blog.source === 'MANUAL_PAGE_IDS' ? (
                    <div className="mt-4 space-y-2">
                      <Label className="block">手动绑定页面</Label>
                      <div className="max-h-48 space-y-2 overflow-auto rounded-md border p-3">
                        {sortedPages.length ? (
                          sortedPages.map((page) => {
                            const checked = config.menus.blog.pageIds.includes(page.id);
                            return (
                              <label key={page.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={checked}
                                  disabled={!config.menus.blog.enabled}
                                  onCheckedChange={(value) =>
                                    toggleManualBlogPage(page.id, Boolean(value))
                                  }
                                />
                                <span>{page.title}</span>
                              </label>
                            );
                          })
                        ) : (
                          <div className="text-sm text-muted-foreground">暂无可选页面</div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-medium">Contact</div>
                    <Switch
                      checked={config.menus.contact.enabled}
                      onCheckedChange={(checked) => updatePageMenu('contact', { enabled: checked })}
                    />
                  </div>
                  <Label className="mb-2 block">绑定页面</Label>
                  <Select
                    value={config.menus.contact.pageId ?? '__none'}
                    onValueChange={(value) =>
                      updatePageMenu('contact', {
                        pageId: value === '__none' ? null : value,
                      })
                    }
                    disabled={!config.menus.contact.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择页面" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">不绑定</SelectItem>
                      {sortedPages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveDraft} disabled={saving || publishing}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  保存草稿
                </Button>
                <Button onClick={handlePublish} disabled={saving || publishing}>
                  {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  发布
                </Button>
                <Button variant="outline" onClick={handleUnpublish} disabled={saving || publishing}>
                  下线
                </Button>
                <Button variant="outline" onClick={loadState} disabled={saving || publishing}>
                  重新加载
                </Button>
              </div>

              <div className="rounded-md border bg-muted/20 p-4 text-sm">
                <div>发布时间：{publishedAt ? new Date(publishedAt).toLocaleString() : '未发布'}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Input value={shareUrl} readOnly placeholder="发布后显示外链" className="min-w-[240px] flex-1" />
                  <Button variant="outline" size="icon" onClick={handleCopyLink} disabled={!shareUrl}>
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={handleOpenLink} disabled={!shareUrl}>
                    <ExternalLinkIcon className="mr-2 h-4 w-4" />
                    打开
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>发布前预览</CardTitle>
              <CardDescription>
                固定菜单与布局，变化的是页面绑定数据。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-md border">
                <SiteTemplateRenderer
                  data={previewRenderData}
                  onRequestPage={(pageId) => {
                    void ensurePageDetail(pageId);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
