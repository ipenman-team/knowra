'use client';

import type { SiteTemplatePage } from '../../template.types';
import { KnowledgePageMenuBase } from './page-menu-base';

type KnowledgeContactMenuProps = {
  pageId: string | null;
  pageMap: Record<string, SiteTemplatePage>;
};

export function KnowledgeContactMenu({
  pageId,
  pageMap,
}: KnowledgeContactMenuProps) {
  return (
    <KnowledgePageMenuBase
      pageId={pageId}
      pageMap={pageMap}
      emptyText="Contact 未绑定页面内容。"
      missingText="页面内容不存在或未发布。"
    />
  );
}
