import { memo } from 'react';
import { Tree } from '@/components/shared/tree';
import { PageTreeItem } from './tree-item';
import { usePageTreeNodes } from '@/stores';
import { usePageTreeCRUD } from '../hooks/use-pages';
import type { PageDto } from '@/lib/api';
export const PageTreeContainer = memo(function PageTreeContainer(props: {}) {
  const { commitRename } = usePageTreeCRUD();
  const nodes = usePageTreeNodes();
  return (
    <>
      <Tree<PageDto>
        nodes={nodes}
        renderNode={(ctx) => (
          <PageTreeItem {...ctx} onCommitRename={commitRename} />
        )}
      />
    </>
  );
});
