import { memo } from 'react';
import { Tree } from '@/components/shared/tree';
import { PageTreeItem } from './tree-item';
import { usePageTreeNodes, useSelectedPageId } from '@/stores';
import { usePageTreeCRUD } from '../hooks/use-pages';
import type { PageDto } from '@/lib/api';
export const PageTreeContainer = memo(function PageTreeContainer(props: {}) {
  const { createPage, commitRename, creatingPage } =
    usePageTreeCRUD();
  const nodes = usePageTreeNodes();
  const selectedPageId = useSelectedPageId();

  return (
    <>
      <Tree<PageDto>
        nodes={nodes}
        selectedId={selectedPageId ?? undefined}
        renderNode={(ctx) => (
          <PageTreeItem
            {...ctx}
            onCommitRename={commitRename}
          />
        )}
      />
    </>
  );
});
