'use client';

import type { SiteTemplatePage } from '../../template.types';
import { KnowledgePageMenuBase } from './page-menu-base';

type KnowledgeHomeMenuProps = {
  pageId: string | null;
  pageMap: Record<string, SiteTemplatePage>;
};

export function KnowledgeHomeMenu({ pageId, pageMap }: KnowledgeHomeMenuProps) {
  return (
    <KnowledgePageMenuBase
      pageId={pageId}
      pageMap={pageMap}
      emptyText="Home 未绑定页面内容。"
      missingText="页面内容不存在或未发布。"
    />
  );
}
