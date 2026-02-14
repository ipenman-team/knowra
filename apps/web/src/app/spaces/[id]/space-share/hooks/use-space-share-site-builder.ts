'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { filesApi, pagesApi } from '@/lib/api';
import type { ShareDto } from '@/lib/api';
import type { PageDto } from '@/lib/api/pages/types';
import {
  siteBuilderApi,
  type SiteBuilderConfig,
  type SiteBuilderCustomMenu,
  type SiteBuilderCustomMenuType,
} from '@/lib/api/site-builder';
import { toast } from 'sonner';
import {
  MAX_LOGO_SIZE_BYTES,
  SITE_BUILDER_AUTOSAVE_DEBOUNCE_MS,
  buildSiteBuilderSignature,
  createDefaultSiteBuilderConfig,
  listSpacePagesForPicker,
  normalizeSiteBuilderConfig,
} from '../space-share.utils';

export function useSpaceShareSiteBuilder({
  spaceId,
  share,
  externalBusy,
}: {
  spaceId: string;
  share: ShareDto | null;
  externalBusy: boolean;
}) {
  const [siteBuilderLoading, setSiteBuilderLoading] = useState(false);
  const [siteBuilderModalOpen, setSiteBuilderModalOpen] = useState(false);
  const [siteBuilderSaving, setSiteBuilderSaving] = useState(false);
  const [siteBuilderPublishing, setSiteBuilderPublishing] = useState(false);
  const [siteBuilderAutosaving, setSiteBuilderAutosaving] = useState(false);
  const [siteBuilderAutosaveError, setSiteBuilderAutosaveError] = useState<string | null>(null);
  const [siteBuilderConfig, setSiteBuilderConfig] = useState<SiteBuilderConfig>(
    createDefaultSiteBuilderConfig(),
  );
  const [siteBuilderPageOptions, setSiteBuilderPageOptions] = useState<PageDto[]>([]);
  const [siteBuilderPageDetailMap, setSiteBuilderPageDetailMap] = useState<
    Record<string, PageDto>
  >({});
  const [siteBuilderPublishedAt, setSiteBuilderPublishedAt] = useState<string | null>(null);
  const [siteBuilderPublicId, setSiteBuilderPublicId] = useState<string | null>(null);
  const [activeSiteBuilderMenuId, setActiveSiteBuilderMenuId] = useState<string | null>(null);
  const [menuSettingsOpen, setMenuSettingsOpen] = useState(false);
  const [pagePickerOpen, setPagePickerOpen] = useState(false);
  const [pagePickerMenuId, setPagePickerMenuId] = useState<string | null>(null);
  const [pageListConfigOpen, setPageListConfigOpen] = useState(false);

  const pageDetailMapRef = useRef<Record<string, PageDto>>({});
  const pageLoadingSetRef = useRef<Set<string>>(new Set());
  const siteBuilderLastSavedSignatureRef = useRef<string>('');
  const siteBuilderAutosaveRequestRef = useRef(0);

  useEffect(() => {
    pageDetailMapRef.current = siteBuilderPageDetailMap;
  }, [siteBuilderPageDetailMap]);

  const siteBuilderShareUrl = useMemo(() => {
    if (!siteBuilderPublicId || typeof window === 'undefined') return '';
    return `${window.location.origin}/share/s/${siteBuilderPublicId}`;
  }, [siteBuilderPublicId]);

  const sortedSiteBuilderPages = useMemo(() => {
    return [...siteBuilderPageOptions].sort((a, b) => {
      const ta = new Date(a.updatedAt).getTime();
      const tb = new Date(b.updatedAt).getTime();
      return tb - ta;
    });
  }, [siteBuilderPageOptions]);

  const activeSiteBuilderMenu = useMemo(() => {
    if (!activeSiteBuilderMenuId) return siteBuilderConfig.customMenus[0] ?? null;
    return (
      siteBuilderConfig.customMenus.find(
        (item) => item.id === activeSiteBuilderMenuId,
      ) ?? null
    );
  }, [activeSiteBuilderMenuId, siteBuilderConfig.customMenus]);

  const activeSiteBuilderPage = useMemo(() => {
    if (!activeSiteBuilderMenu) return null;
    const pageId = activeSiteBuilderMenu.pageId;
    if (!pageId) return null;
    return siteBuilderPageDetailMap[pageId] ?? null;
  }, [activeSiteBuilderMenu, siteBuilderPageDetailMap]);

  const activeSiteBuilderPageListPages = useMemo(() => {
    if (!activeSiteBuilderMenu || activeSiteBuilderMenu.type !== 'PAGE_LIST') {
      return [];
    }
    const fallbackPageById = new Map(
      siteBuilderPageOptions.map((page) => [page.id, page]),
    );
    return activeSiteBuilderMenu.pageIds
      .map((pageId) => siteBuilderPageDetailMap[pageId] ?? fallbackPageById.get(pageId) ?? null)
      .filter((page): page is PageDto => Boolean(page));
  }, [activeSiteBuilderMenu, siteBuilderPageDetailMap, siteBuilderPageOptions]);

  const siteBuilderConfigSignature = useMemo(
    () => buildSiteBuilderSignature(siteBuilderConfig),
    [siteBuilderConfig],
  );

  useEffect(() => {
    if (!siteBuilderConfig.customMenus.length) {
      setActiveSiteBuilderMenuId(null);
      return;
    }
    setActiveSiteBuilderMenuId((prev) => {
      if (prev && siteBuilderConfig.customMenus.some((item) => item.id === prev)) {
        return prev;
      }
      return siteBuilderConfig.customMenus[0].id;
    });
  }, [siteBuilderConfig.customMenus]);

  const ensureSiteBuilderPageDetail = useCallback(
    async (pageId: string | null | undefined) => {
      const id = pageId?.trim();
      if (!id) return;
      if (pageDetailMapRef.current[id]) return;
      if (pageLoadingSetRef.current.has(id)) return;

      try {
        pageLoadingSetRef.current.add(id);
        const detail = await pagesApi.get(spaceId, id);
        setSiteBuilderPageDetailMap((prev) => ({
          ...prev,
          [id]: detail,
        }));
      } catch (error) {
        console.error(error);
      } finally {
        pageLoadingSetRef.current.delete(id);
      }
    },
    [spaceId],
  );

  const loadSiteBuilderState = useCallback(async () => {
    if (!spaceId) return;
    try {
      setSiteBuilderLoading(true);
      const [builderState, pages] = await Promise.all([
        siteBuilderApi.get(spaceId),
        listSpacePagesForPicker(spaceId),
      ]);

      const nextConfig = normalizeSiteBuilderConfig(
        builderState.draft ?? builderState.published ?? createDefaultSiteBuilderConfig(),
      );

      setSiteBuilderConfig(nextConfig);
      setActiveSiteBuilderMenuId(nextConfig.customMenus[0]?.id ?? null);
      setSiteBuilderPageOptions(pages);
      setSiteBuilderPageDetailMap({});
      setSiteBuilderPublishedAt(builderState.publishedAt ?? null);
      setSiteBuilderPublicId(builderState.share?.publicId ?? null);
      setSiteBuilderAutosaveError(null);
      siteBuilderLastSavedSignatureRef.current =
        buildSiteBuilderSignature(nextConfig);
    } catch (error) {
      console.error(error);
      toast.error('获取展示页配置失败');
    } finally {
      setSiteBuilderLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (!share) {
      setSiteBuilderModalOpen(false);
      setSiteBuilderConfig(createDefaultSiteBuilderConfig());
      setSiteBuilderPageOptions([]);
      setSiteBuilderPageDetailMap({});
      setSiteBuilderPublishedAt(null);
      setSiteBuilderPublicId(null);
      setActiveSiteBuilderMenuId(null);
      setPagePickerOpen(false);
      setPagePickerMenuId(null);
      setPageListConfigOpen(false);
      setMenuSettingsOpen(false);
      setSiteBuilderAutosaving(false);
      setSiteBuilderAutosaveError(null);
      siteBuilderLastSavedSignatureRef.current = '';
      return;
    }
    void loadSiteBuilderState();
  }, [share, loadSiteBuilderState]);

  useEffect(() => {
    if (!activeSiteBuilderMenu) return;
    if (activeSiteBuilderMenu.type === 'SINGLE_PAGE') {
      void ensureSiteBuilderPageDetail(activeSiteBuilderMenu.pageId);
      return;
    }

    for (const pageId of activeSiteBuilderMenu.pageIds) {
      void ensureSiteBuilderPageDetail(pageId);
    }
  }, [activeSiteBuilderMenu, ensureSiteBuilderPageDetail]);

  useEffect(() => {
    if (!activeSiteBuilderMenu || activeSiteBuilderMenu.type !== 'PAGE_LIST') {
      setPageListConfigOpen(false);
    }
  }, [activeSiteBuilderMenu]);

  const buildSiteBuilderConfigForSubmit = useCallback((config: SiteBuilderConfig): SiteBuilderConfig => {
    return {
      ...normalizeSiteBuilderConfig(config),
      updatedAt: new Date().toISOString(),
    };
  }, []);

  const updateSiteBuilderConfig = useCallback(
    (updater: (previous: SiteBuilderConfig) => SiteBuilderConfig) => {
      setSiteBuilderConfig((previous) =>
        normalizeSiteBuilderConfig(updater(previous)),
      );
    },
    [],
  );

  const handleTemplateChange = useCallback(
    (template: SiteBuilderConfig['template']) => {
      updateSiteBuilderConfig((previous) => ({
        ...previous,
        template,
      }));
    },
    [updateSiteBuilderConfig],
  );

  const saveSiteBuilderDraft = useCallback(
    async (
      config: SiteBuilderConfig,
      options?: { showToast?: boolean; skipMarkSaved?: boolean },
    ) => {
      const signature = buildSiteBuilderSignature(config);
      await siteBuilderApi.saveDraft(
        spaceId,
        buildSiteBuilderConfigForSubmit(config),
      );
      if (!options?.skipMarkSaved) {
        siteBuilderLastSavedSignatureRef.current = signature;
      }
      setSiteBuilderAutosaveError(null);
      if (options?.showToast) {
        toast.success('草稿已保存');
      }
    },
    [buildSiteBuilderConfigForSubmit, spaceId],
  );

  useEffect(() => {
    if (!share) return;
    if (siteBuilderLoading || siteBuilderPublishing) return;
    if (
      siteBuilderConfigSignature ===
      siteBuilderLastSavedSignatureRef.current
    ) {
      return;
    }

    const autosaveConfig = siteBuilderConfig;
    const signature = siteBuilderConfigSignature;
    const timer = window.setTimeout(() => {
      const requestId = siteBuilderAutosaveRequestRef.current + 1;
      siteBuilderAutosaveRequestRef.current = requestId;
      setSiteBuilderAutosaving(true);
      setSiteBuilderAutosaveError(null);

      void saveSiteBuilderDraft(autosaveConfig, { skipMarkSaved: true })
        .then(() => {
          if (requestId !== siteBuilderAutosaveRequestRef.current) return;
          siteBuilderLastSavedSignatureRef.current = signature;
        })
        .catch((error) => {
          if (requestId !== siteBuilderAutosaveRequestRef.current) return;
          console.error(error);
          setSiteBuilderAutosaveError('自动保存失败，请稍后重试');
        })
        .finally(() => {
          if (requestId !== siteBuilderAutosaveRequestRef.current) return;
          setSiteBuilderAutosaving(false);
        });
    }, SITE_BUILDER_AUTOSAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    saveSiteBuilderDraft,
    share,
    siteBuilderConfig,
    siteBuilderConfigSignature,
    siteBuilderLoading,
    siteBuilderPublishing,
  ]);

  const handleSaveSiteBuilderDraft = useCallback(async () => {
    if (!share) return;
    try {
      setSiteBuilderSaving(true);
      await saveSiteBuilderDraft(siteBuilderConfig, { showToast: true });
    } catch (error) {
      console.error(error);
      toast.error('保存草稿失败');
    } finally {
      setSiteBuilderSaving(false);
    }
  }, [saveSiteBuilderDraft, share, siteBuilderConfig]);

  const handlePublishSiteBuilder = useCallback(async () => {
    if (!share) return;
    try {
      setSiteBuilderPublishing(true);
      await saveSiteBuilderDraft(siteBuilderConfig);
      const published = await siteBuilderApi.publish(spaceId, { visibility: 'PUBLIC' });
      setSiteBuilderPublicId(published.publicId);
      setSiteBuilderPublishedAt(published.publishedAt);
      toast.success('展示页发布成功');
    } catch (error) {
      console.error(error);
      toast.error('发布失败');
    } finally {
      setSiteBuilderPublishing(false);
    }
  }, [saveSiteBuilderDraft, share, siteBuilderConfig, spaceId]);

  const handleUnpublishSiteBuilder = useCallback(async () => {
    if (!share) return;
    try {
      setSiteBuilderPublishing(true);
      await siteBuilderApi.unpublish(spaceId);
      setSiteBuilderPublicId(null);
      setSiteBuilderPublishedAt(null);
      toast.success('展示页已下架');
    } catch (error) {
      console.error(error);
      toast.error('下架失败');
    } finally {
      setSiteBuilderPublishing(false);
    }
  }, [share, spaceId]);

  const handleCopySiteBuilderLink = useCallback(async () => {
    if (!siteBuilderShareUrl) return;
    try {
      await navigator.clipboard.writeText(siteBuilderShareUrl);
      toast.success('展示页链接已复制');
    } catch (error) {
      console.error(error);
      toast.error('复制展示页链接失败');
    }
  }, [siteBuilderShareUrl]);

  const handleOpenSiteBuilderLink = useCallback(() => {
    if (!siteBuilderShareUrl) return;
    window.open(siteBuilderShareUrl, '_blank', 'noopener,noreferrer');
  }, [siteBuilderShareUrl]);

  const handleAddCustomMenu = useCallback(() => {
    const newMenu: SiteBuilderCustomMenu = {
      id: `menu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: `Menu ${siteBuilderConfig.customMenus.length + 1}`,
      type: 'SINGLE_PAGE',
      style: 'card',
      pageId: null,
      pageIds: [],
      pageCovers: {},
    };
    updateSiteBuilderConfig((previous) => ({
      ...previous,
      customMenus: [...previous.customMenus, newMenu],
    }));
    setActiveSiteBuilderMenuId(newMenu.id);
    setMenuSettingsOpen(true);
  }, [siteBuilderConfig.customMenus.length, updateSiteBuilderConfig]);

  const canDeleteActiveMenu = siteBuilderConfig.customMenus.length > 1;

  const handleDeleteActiveMenu = useCallback(() => {
    if (!activeSiteBuilderMenuId) return;
    if (!canDeleteActiveMenu) {
      toast.error('至少保留一个菜单');
      return;
    }
    updateSiteBuilderConfig((previous) => ({
      ...previous,
      customMenus: previous.customMenus.filter(
        (menu) => menu.id !== activeSiteBuilderMenuId,
      ),
    }));
    setMenuSettingsOpen(false);
    setPageListConfigOpen(false);
  }, [activeSiteBuilderMenuId, canDeleteActiveMenu, updateSiteBuilderConfig]);

  const updateActiveSiteBuilderMenu = useCallback(
    (
      updater: (
        menu: SiteBuilderCustomMenu,
      ) => SiteBuilderCustomMenu,
    ) => {
      if (!activeSiteBuilderMenuId) return;
      updateSiteBuilderConfig((previous) => ({
        ...previous,
        customMenus: previous.customMenus.map((menu) =>
          menu.id === activeSiteBuilderMenuId ? updater(menu) : menu,
        ),
      }));
    },
    [activeSiteBuilderMenuId, updateSiteBuilderConfig],
  );

  const handleUpdateActiveMenuLabel = useCallback(
    (label: string) => {
      updateActiveSiteBuilderMenu((menu) => ({
        ...menu,
        label: label.trimStart(),
      }));
    },
    [updateActiveSiteBuilderMenu],
  );

  const handleUpdateActiveMenuType = useCallback(
    (type: SiteBuilderCustomMenuType) => {
      updateActiveSiteBuilderMenu((menu) => {
        if (type === menu.type) return menu;
        if (type === 'PAGE_LIST') {
          const pageIds = menu.pageId ? [menu.pageId] : [];
          return {
            ...menu,
            type,
            style: menu.style ?? 'card',
            pageId: null,
            pageIds,
            pageCovers: Object.fromEntries(
              pageIds
                .map((pageId) => [pageId, menu.pageCovers[pageId]] as const)
                .filter(
                  (entry): entry is [string, string] =>
                    typeof entry[1] === 'string' && Boolean(entry[1].trim()),
                ),
            ),
          };
        }
        return {
          ...menu,
          type,
          pageId: menu.pageId ?? menu.pageIds[0] ?? null,
          pageIds: [],
          pageCovers: {},
        };
      });
      if (type === 'PAGE_LIST') {
        setPageListConfigOpen(true);
      }
    },
    [updateActiveSiteBuilderMenu],
  );

  const openPagePickerForMenu = useCallback((menuId: string) => {
    setPagePickerMenuId(menuId);
    setPagePickerOpen(true);
  }, []);

  const handleSelectPageForMenu = useCallback(
    async (pageId: string) => {
      if (!pagePickerMenuId) return;

      updateSiteBuilderConfig((previous) => ({
        ...previous,
        customMenus: previous.customMenus.map((menu) =>
          menu.id === pagePickerMenuId
            ? {
                ...menu,
                type: 'SINGLE_PAGE',
                style: menu.style ?? 'card',
                pageId,
                pageIds: [],
                pageCovers: {},
              }
            : menu,
        ),
      }));
      setActiveSiteBuilderMenuId(pagePickerMenuId);
      setPagePickerOpen(false);
      setPagePickerMenuId(null);
      await ensureSiteBuilderPageDetail(pageId);
    },
    [ensureSiteBuilderPageDetail, pagePickerMenuId, updateSiteBuilderConfig],
  );

  const handlePagePickerOpenChange = useCallback((open: boolean) => {
    setPagePickerOpen(open);
    if (!open) {
      setPagePickerMenuId(null);
    }
  }, []);

  const handleReplaceActiveMenuPage = useCallback(() => {
    if (!activeSiteBuilderMenuId || !activeSiteBuilderMenu) return;
    if (activeSiteBuilderMenu.type === 'PAGE_LIST') {
      setPageListConfigOpen(true);
      return;
    }
    openPagePickerForMenu(activeSiteBuilderMenuId);
  }, [activeSiteBuilderMenu, activeSiteBuilderMenuId, openPagePickerForMenu]);

  const handleClearActiveMenuPage = useCallback(() => {
    if (!activeSiteBuilderMenu) return;
    updateActiveSiteBuilderMenu((menu) => ({
      ...menu,
      pageId: null,
      pageIds: [],
      pageCovers: {},
    }));
  }, [activeSiteBuilderMenu, updateActiveSiteBuilderMenu]);

  const handleApplyPageListConfig = useCallback(
    async (next: {
      style: 'list' | 'card';
      pageIds: string[];
      pageCovers?: Record<string, string>;
    }) => {
      if (!activeSiteBuilderMenuId) return;

      updateSiteBuilderConfig((previous) => ({
        ...previous,
        customMenus: previous.customMenus.map((menu) =>
          menu.id === activeSiteBuilderMenuId
            ? {
                ...menu,
                type: 'PAGE_LIST',
                style: next.style,
                pageId: null,
                pageIds: next.pageIds,
                pageCovers: Object.fromEntries(
                  next.pageIds
                    .map((pageId) => [pageId, next.pageCovers?.[pageId] ?? menu.pageCovers[pageId]] as const)
                    .filter(
                      (entry): entry is [string, string] =>
                        typeof entry[1] === 'string' && Boolean(entry[1].trim()),
                    ),
                ),
              }
            : menu,
        ),
      }));

      setPageListConfigOpen(false);
      for (const pageId of next.pageIds) {
        await ensureSiteBuilderPageDetail(pageId);
      }
    },
    [activeSiteBuilderMenuId, ensureSiteBuilderPageDetail, updateSiteBuilderConfig],
  );

  const handleReorderActivePageList = useCallback(
    (nextPageIds: string[]) => {
      updateActiveSiteBuilderMenu((menu) => ({
        ...menu,
        pageIds: Array.from(new Set(nextPageIds)),
      }));
    },
    [updateActiveSiteBuilderMenu],
  );

  const handleUpdateActivePageCover = useCallback(
    (pageId: string, coverUrl: string | null) => {
      if (!pageId.trim()) return;
      updateActiveSiteBuilderMenu((menu) => {
        const nextPageCovers = { ...menu.pageCovers };
        if (coverUrl?.trim()) {
          nextPageCovers[pageId] = coverUrl.trim();
        } else {
          delete nextPageCovers[pageId];
        }
        return {
          ...menu,
          pageCovers: nextPageCovers,
        };
      });
    },
    [updateActiveSiteBuilderMenu],
  );

  const handleUpdateActivePageListStyle = useCallback(
    (style: 'list' | 'card') => {
      updateActiveSiteBuilderMenu((menu) => {
        if (menu.type !== 'PAGE_LIST') return menu;
        return {
          ...menu,
          style,
        };
      });
    },
    [updateActiveSiteBuilderMenu],
  );

  const uploadSiteBuilderImage = useCallback(
    async (file: File, from: 'site-builder/logo' | 'site-builder/page-cover') => {
      try {
        const result = await filesApi.upload({
          file,
          from,
        });
        if (!result?.url || !result.url.trim()) {
          toast.error('上传失败');
          return null;
        }
        return result.url.trim();
      } catch (error) {
        console.error(error);
        toast.error('上传失败');
        return null;
      }
    },
    [],
  );

  const handleUploadLogoFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return null;
      }
      if (file.size > MAX_LOGO_SIZE_BYTES) {
        toast.error('Logo 文件不能超过 2MB');
        return null;
      }
      return uploadSiteBuilderImage(file, 'site-builder/logo');
    },
    [uploadSiteBuilderImage],
  );

  const handleChangeLogoUrl = useCallback(
    (logoUrl: string | null) => {
      updateSiteBuilderConfig((previous) => ({
        ...previous,
        branding: {
          ...previous.branding,
          logoUrl: logoUrl?.trim() ? logoUrl.trim() : null,
        },
      }));
    },
    [updateSiteBuilderConfig],
  );

  const handleUploadPageCoverFile = useCallback(
    async (file: File): Promise<string | null> => {
      return uploadSiteBuilderImage(file, 'site-builder/page-cover');
    },
    [uploadSiteBuilderImage],
  );

  const siteBuilderActionBusy =
    externalBusy || siteBuilderLoading || siteBuilderSaving || siteBuilderPublishing;

  return {
    siteBuilderLoading,
    siteBuilderModalOpen,
    setSiteBuilderModalOpen,
    siteBuilderSaving,
    siteBuilderPublishing,
    siteBuilderAutosaving,
    siteBuilderAutosaveError,
    siteBuilderConfig,
    handleTemplateChange,
    siteBuilderShareUrl,
    siteBuilderPublishedAt,
    handleSaveSiteBuilderDraft,
    handlePublishSiteBuilder,
    handleUnpublishSiteBuilder,
    handleCopySiteBuilderLink,
    handleOpenSiteBuilderLink,
    handleUploadLogoFile,
    handleChangeLogoUrl,
    activeSiteBuilderMenuId,
    setActiveSiteBuilderMenuId,
    activeSiteBuilderMenu,
    activeSiteBuilderPage,
    activeSiteBuilderPageListPages,
    activeSiteBuilderPageCoverMap: activeSiteBuilderMenu?.pageCovers ?? {},
    menuSettingsOpen,
    setMenuSettingsOpen,
    handleAddCustomMenu,
    canDeleteActiveMenu,
    handleDeleteActiveMenu,
    handleUpdateActiveMenuLabel,
    handleUpdateActiveMenuType,
    handleReplaceActiveMenuPage,
    handleClearActiveMenuPage,
    setPageListConfigOpen,
    handleReorderActivePageList,
    handleUpdateActivePageCover,
    handleUpdateActivePageListStyle,
    handleUploadPageCoverFile,
    pagePickerOpen,
    handlePagePickerOpenChange,
    sortedSiteBuilderPages,
    handleSelectPageForMenu,
    pageListConfigOpen,
    handleApplyPageListConfig,
    siteBuilderActionBusy,
  };
}
