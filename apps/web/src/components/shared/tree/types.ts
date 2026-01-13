/**
 * 通用树组件的类型定义
 */

export type TreeNode<TData = unknown> = {
  id: string;
  label: string;
  children?: TreeNode<TData>[];
  data?: TData;
};

export type TreeRenderContext<TData = unknown> = {
  node: TreeNode<TData>;
  depth: number;
  selected: boolean;
  hasChildren: boolean;
  expanded: boolean;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
};
