import type {
  SiteBuilderBlogStyle,
  SiteBuilderMenus,
  SiteBuilderTemplate,
} from '@/lib/api/site-builder';

export type SiteTemplatePage = {
  id: string;
  title: string;
  content: unknown;
  updatedAt: string;
};

export type SiteTemplateBlogItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export type SiteTemplateRenderData = {
  template: SiteBuilderTemplate;
  siteName: string;
  publishedAt?: string | null;
  menus: SiteBuilderMenus;
  pageMap: Record<string, SiteTemplatePage>;
  menuData: {
    homePageId: string | null;
    aboutPageId: string | null;
    contactPageId: string | null;
    blog: {
      style: SiteBuilderBlogStyle;
      items: SiteTemplateBlogItem[];
    };
  };
  footerText?: string;
};

export type SiteTemplateRendererProps = {
  data: SiteTemplateRenderData;
  onRequestPage?: (pageId: string | null) => void;
};
