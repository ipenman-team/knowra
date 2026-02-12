import { apiClient } from './client';

export type SiteBuilderMenuKey = 'home' | 'about' | 'blog' | 'contact';
export type SiteBuilderTemplate = 'knowledge-site';
export type SiteBuilderThemeMode = 'light' | 'dark' | 'system';
export type SiteBuilderBlogSource = 'LATEST_PUBLISHED' | 'MANUAL_PAGE_IDS';
export type SiteBuilderBlogStyle = 'list' | 'card';

export type SiteBuilderPageMenu = {
  enabled: boolean;
  pageId: string | null;
};

export type SiteBuilderBlogMenu = {
  enabled: boolean;
  source: SiteBuilderBlogSource;
  style: SiteBuilderBlogStyle;
  pageIds: string[];
  limit: number;
};

export type SiteBuilderMenus = {
  home: SiteBuilderPageMenu;
  about: SiteBuilderPageMenu;
  blog: SiteBuilderBlogMenu;
  contact: SiteBuilderPageMenu;
};

export type SiteBuilderConfig = {
  version: 1;
  template: SiteBuilderTemplate;
  theme: {
    mode: SiteBuilderThemeMode;
    primaryColor: string;
  };
  menus: SiteBuilderMenus;
  updatedAt: string;
  updatedBy: string;
};

export type SiteBuilderStateDto = {
  draft: SiteBuilderConfig | null;
  published: SiteBuilderConfig | null;
  publishedAt: string | null;
  publishedBy: string | null;
  share: {
    id: string;
    publicId: string;
    status: string;
    visibility: 'PUBLIC' | 'RESTRICTED';
    expiresAt?: string | null;
  } | null;
};

export type PublishSiteBuilderInput = {
  visibility?: 'PUBLIC' | 'RESTRICTED';
  password?: string | null;
  expiresAt?: string | null;
  tokenEnabled?: boolean | null;
};

export const siteBuilderApi = {
  async get(spaceId: string) {
    const res = await apiClient.get<SiteBuilderStateDto>(
      `/spaces/${encodeURIComponent(spaceId)}/site-builder`,
    );
    return res.data;
  },

  async saveDraft(spaceId: string, config: SiteBuilderConfig) {
    const res = await apiClient.put<SiteBuilderConfig>(
      `/spaces/${encodeURIComponent(spaceId)}/site-builder/draft`,
      { config },
    );
    return res.data;
  },

  async publish(spaceId: string, input?: PublishSiteBuilderInput) {
    const res = await apiClient.post<{
      publicId: string;
      url: string;
      publishedAt: string;
    }>(`/spaces/${encodeURIComponent(spaceId)}/site-builder/publish`, input ?? {});
    return res.data;
  },

  async unpublish(spaceId: string) {
    const res = await apiClient.post<{ ok: true; revoked: boolean }>(
      `/spaces/${encodeURIComponent(spaceId)}/site-builder/unpublish`,
    );
    return res.data;
  },
};
