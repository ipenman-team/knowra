'use client';

import type { SiteTemplatePage } from '../../template.types';
import { KnowledgePageMenuBase } from './page-menu-base';

type KnowledgeAboutMenuProps = {
  pageId: string | null;
  pageMap: Record<string, SiteTemplatePage>;
};

export function KnowledgeAboutMenu({ pageId, pageMap }: KnowledgeAboutMenuProps) {
  return (
    <KnowledgePageMenuBase
      pageId={pageId}
      pageMap={pageMap}
      emptyText="About 未绑定页面内容。"
      missingText="页面内容不存在或未发布。"
    />
  );
}
