import type { ShareVisibility } from '@knowra/domain';

export type SiteBuilderMenuKey = 'home' | 'about' | 'blog' | 'contact';

export type SiteBuilderTemplate = 'knowledge-site';

export type SiteBuilderThemeMode = 'light' | 'dark' | 'system';

export type SiteBuilderTheme = {
  mode: SiteBuilderThemeMode;
  primaryColor: string;
};

export type SiteBuilderPageMenuConfig = {
  enabled: boolean;
  pageId: string | null;
};

export type SiteBuilderBlogSource = 'LATEST_PUBLISHED' | 'MANUAL_PAGE_IDS';

export type SiteBuilderBlogStyle = 'list' | 'card';

export type SiteBuilderBlogMenuConfig = {
  enabled: boolean;
  source: SiteBuilderBlogSource;
  style: SiteBuilderBlogStyle;
  pageIds: string[];
  limit: number;
};

export type SiteBuilderCustomMenuType = 'SINGLE_PAGE' | 'PAGE_LIST';

export type SiteBuilderCustomMenuConfig = {
  id: string;
  label: string;
  type: SiteBuilderCustomMenuType;
  style: SiteBuilderBlogStyle;
  pageId: string | null;
  pageIds: string[];
  pageCovers: Record<string, string>;
};

export type SiteBuilderBranding = {
  logoUrl: string | null;
};

export type SiteBuilderMenus = {
  home: SiteBuilderPageMenuConfig;
  about: SiteBuilderPageMenuConfig;
  blog: SiteBuilderBlogMenuConfig;
  contact: SiteBuilderPageMenuConfig;
};

export type SiteBuilderConfigV1 = {
  version: 1;
  template: SiteBuilderTemplate;
  theme: SiteBuilderTheme;
  menus: SiteBuilderMenus;
  customMenus: SiteBuilderCustomMenuConfig[];
  branding: SiteBuilderBranding;
  updatedAt: string;
  updatedBy: string;
};

export type SiteBuilderMetadata = {
  draft?: SiteBuilderConfigV1;
  published?: SiteBuilderConfigV1;
  publishedAt?: string | null;
  publishedBy?: string | null;
};

export type SiteBuilderShareSummary = {
  id: string;
  publicId: string;
  status: string;
  visibility: ShareVisibility;
  expiresAt?: string | null;
};

export type SiteBuilderGetResult = {
  draft: SiteBuilderConfigV1 | null;
  published: SiteBuilderConfigV1 | null;
  publishedAt: string | null;
  publishedBy: string | null;
  share: SiteBuilderShareSummary | null;
};

export type PublishSiteBuilderResult = {
  publicId: string;
  url: string;
  publishedAt: string;
};
