'use client';

import { PageEditor } from '@/components/editor';
import { useSelectedPageId } from '@/stores';
import { PageHeader } from './page-header';

export function PageContainer(props: {}) {
  const selectedPageId = useSelectedPageId();

  return (
    <>
      <PageHeader />
      {selectedPageId ? (
        <div className="p-6">
          <PageEditor />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          请选择或创建一个页面
        </div>
      )}
    </>
  );
}
