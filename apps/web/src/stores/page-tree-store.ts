import { create } from 'zustand';
import type { TreeNode } from '@/components/shared/tree';
import type { PageDto } from '@/lib/api';

type PageTreeNode = TreeNode<PageDto>;

interface PageTreeState {
  pageTreeNodes: PageTreeNode[];
  pagesLoaded: boolean;
  creatingPage: boolean;

  setPageTreeNodes: (nodes: PageTreeNode[]) => void;
  setPagesLoaded: (loaded: boolean) => void;
  setCreatingPage: (creating: boolean) => void;
  updateNode: (
    id: string,
    updates: Partial<Pick<PageTreeNode, 'label' | 'data'>>
  ) => void;
}

function updateNodeInTree(
  nodes: PageTreeNode[],
  id: string,
  updates: Partial<Pick<PageTreeNode, 'label' | 'data'>>
): { next: PageTreeNode[]; changed: boolean } {
  let changed = false;

  const next = nodes.map((node) => {
    if (node.id === id) {
      changed = true;
      return {
        ...node,
        ...updates,
      };
    }

    if (!node.children?.length) return node;

    const childResult = updateNodeInTree(node.children, id, updates);
    if (!childResult.changed) return node;

    changed = true;
    return {
      ...node,
      children: childResult.next,
    };
  });

  return { next, changed };
}

export const usePageTreeStore = create<PageTreeState>((set) => ({
  pageTreeNodes: [],
  pagesLoaded: false,
  creatingPage: false,

  setPageTreeNodes: (pageTreeNodes) => set({ pageTreeNodes }),
  setPagesLoaded: (pagesLoaded) => set({ pagesLoaded }),
  setCreatingPage: (creatingPage) => set({ creatingPage }),

  updateNode: (id, updates) =>
    set((state) => {
      const result = updateNodeInTree(state.pageTreeNodes, id, updates);
      if (!result.changed) return state;
      return { pageTreeNodes: result.next };
    }),
}));

export const usePageTreeNodes = () => usePageTreeStore((s) => s.pageTreeNodes);
export const usePagesLoaded = () => usePageTreeStore((s) => s.pagesLoaded);
export const useCreatingPage = () => usePageTreeStore((s) => s.creatingPage);
