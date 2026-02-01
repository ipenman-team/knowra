'use client';

import { useSelectedPageId } from '@/stores';
import { PageHeader } from './page-header';
import { PageContent } from './page-content';

export function PageContainer(props: {}) {
  const selectedPageId = useSelectedPageId();

  return (
    <>
      <PageHeader />
      <div className="px-6">
        <PageContent />
      </div>
    </>
  );
}
