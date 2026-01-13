import { create } from 'zustand';
import type { TreeNode } from '@/components/shared/tree';
import type { PageDto } from '@/lib/api';

interface PageTreeState {
  pageTreeNodes: TreeNode<PageDto>[];
  pagesLoaded: boolean;
  creatingPage: boolean;

  setPageTreeNodes: (nodes: TreeNode<PageDto>[]) => void;
  setPagesLoaded: (loaded: boolean) => void;
  setCreatingPage: (creating: boolean) => void;

  // Optimized update for single node changes
  updateNode: (
    nodeId: string,
    updates: Partial<TreeNode<PageDto>>
  ) => void;
}

// Helper function for immutable tree updates
function updateTreeNode<T>(
  nodes: TreeNode<T>[],
  nodeId: string,
  updates: Partial<TreeNode<T>>
): TreeNode<T>[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, ...updates };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeNode(node.children, nodeId, updates),
      };
    }
    return node;
  });
}

export const usePageTreeStore = create<PageTreeState>((set) => ({
  pageTreeNodes: [],
  pagesLoaded: false,
  creatingPage: false,

  setPageTreeNodes: (pageTreeNodes) => set({ pageTreeNodes }),
  setPagesLoaded: (pagesLoaded) => set({ pagesLoaded }),
  setCreatingPage: (creatingPage) => set({ creatingPage }),

  updateNode: (nodeId, updates) =>
    set((state) => ({
      pageTreeNodes: updateTreeNode(state.pageTreeNodes, nodeId, updates),
    })),
}));

// Selector hooks
export const usePageTreeNodes = () =>
  usePageTreeStore((s) => s.pageTreeNodes);
export const usePagesLoaded = () => usePageTreeStore((s) => s.pagesLoaded);
export const useCreatingPage = () => usePageTreeStore((s) => s.creatingPage);
