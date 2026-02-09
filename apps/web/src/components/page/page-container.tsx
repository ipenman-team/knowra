'use client';

import { PageHeader } from './page-header';
import { PageContent } from './page-content';
import { useSelectedPageId, usePageContentStore } from '@/stores';
import { useSpacesLoading, useCurrentSpaceId } from '@/stores/space-store';
import { useTreePagesLoading } from '@/stores/pages-store';

export function PageContainer(props: {}) {
  const selectedPageId = useSelectedPageId();
  const pageLoading = usePageContentStore((s) => s.pageLoading);
  const spacesLoading = useSpacesLoading();
  const currentSpaceId = useCurrentSpaceId();
  const pagesLoading = useTreePagesLoading(currentSpaceId);

  const isInitialLoading = !selectedPageId && (spacesLoading || pagesLoading || pageLoading);
  const isEmpty = !selectedPageId && !spacesLoading && !pagesLoading && !pageLoading;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        加载中…
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        请选择一个文档
      </div>
    );
  }

  return (
    <>
      <PageHeader />
      <div className="px-6">
        <PageContent />
      </div>
    </>
  );
}
