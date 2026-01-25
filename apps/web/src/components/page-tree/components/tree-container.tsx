import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Tree } from '@/components/shared/tree';
import { PageTreeHeader } from './tree-header';
import { PageTreeItem } from './tree-item';
import { usePagesLoaded, usePageTreeNodes, useSelectedPageId } from '@/stores';
import { usePageTreeCRUD } from '../hooks/use-page-tree-crud';
import type { PageDto } from '@/lib/api';
import { buildPageTreeFromFlatPages } from '@contexta/shared';

const mockFlatPages: PageDto[] = [
  {
    id: 'd-1',
    title: '目录 1',
    parentIds: [],
    createdAt: new Date().toISOString(),
    tenantId: '',
    spaceId: 'cmktxnq470003jkmwfnkslfje',
    updatedAt: '',
  },
  {
    id: 'p-1',
    title: '页面 A',
    parentIds: ['d-1'],
    createdAt: new Date().toISOString(),
    tenantId: '',
    spaceId: 'cmktxnq470003jkmwfnkslfje',
    updatedAt: '',
  },
  {
    id: 'p-2',
    title: '页面 B',
    parentIds: ['d-1'],
    createdAt: new Date().toISOString(),
    tenantId: '',
    spaceId: 'cmktxnq470003jkmwfnkslfje',
    updatedAt: '',
  },
  {
    id: 'd-2',
    title: '目录 2',
    parentIds: [],
    createdAt: new Date().toISOString(),
    tenantId: '',
    spaceId: 'cmktxnq470003jkmwfnkslfje',
    updatedAt: '',
  },
  {
    id: 'p-3',
    title: '页面 C',
    parentIds: ['d-2'],
    createdAt: new Date().toISOString(),
    tenantId: '',
    spaceId: 'cmktxnq470003jkmwfnkslfje',
    updatedAt: '',
  },
];
export const PageTreeContainer = memo(function PageTreeContainer({
  onOpenImport,
}: {
  onOpenImport: () => void;
}) {
  const { createPage, createChildPage, commitRename, creatingPage } =
    usePageTreeCRUD();
  const pagesLoaded = usePagesLoaded();
  const nodes = /* usePageTreeNodes() */ buildPageTreeFromFlatPages(mockFlatPages);
  console.log(nodes);
  const selectedPageId = useSelectedPageId();

  return (
    <>
      <Tree<PageDto>
        nodes={nodes}
        selectedId={selectedPageId ?? undefined}
        renderNode={(ctx) => (
          <PageTreeItem
            {...ctx}
            onCreateChildPage={createChildPage}
            onCommitRename={commitRename}
          />
        )}
      />
    </>
  );
});
