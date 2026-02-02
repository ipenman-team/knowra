'use client';

import { PageHeader } from './page-header';
import { PageContent } from './page-content';

export function PageContainer(props: {}) {

  return (
    <>
      <PageHeader />
      <div className="px-6">
        <PageContent />
      </div>
    </>
  );
}
