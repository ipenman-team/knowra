import * as React from "react";

import { cn } from "@/lib/utils";

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

export function Tree<TData = unknown>(props: {
  nodes: TreeNode<TData>[];
  selectedId?: string;
  onSelect?: (node: TreeNode<TData>) => void;
  renderNode?: (ctx: TreeRenderContext<TData>) => React.ReactNode;
  indentPx?: number;
  defaultExpandAll?: boolean;
  defaultExpandedIds?: string[];
  className?: string;
}) {
  const {
    nodes,
    selectedId,
    onSelect,
    renderNode,
    indentPx = 14,
    defaultExpandAll = true,
    defaultExpandedIds,
    className,
  } = props;

  function collectExpandableIds(list: TreeNode<TData>[]): string[] {
    const ids: string[] = [];

    function walk(nodeList: TreeNode<TData>[]) {
      for (const node of nodeList) {
        if (node.children?.length) {
          ids.push(node.id);
          walk(node.children);
        }
      }
    }

    walk(list);
    return ids;
  }

  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => {
    if (defaultExpandedIds?.length) {
      return new Set(defaultExpandedIds);
    }
    if (defaultExpandAll) {
      return new Set(collectExpandableIds(nodes));
    }
    return new Set<string>();
  });

  React.useEffect(() => {
    if (!selectedId) return;

    const ancestors = new Set<string>();

    function walk(nodeList: TreeNode<TData>[], path: string[]): boolean {
      for (const node of nodeList) {
        const nextPath = [...path, node.id];
        if (node.id === selectedId) {
          for (const id of path) ancestors.add(id);
          return true;
        }
        if (node.children?.length && walk(node.children, nextPath)) {
          if (node.children?.length) ancestors.add(node.id);
          return true;
        }
      }
      return false;
    }

    walk(nodes, []);

    if (ancestors.size) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        for (const id of ancestors) next.add(id);
        return next;
      });
    }
  }, [nodes, selectedId]);

  function renderTreeNode(node: TreeNode<TData>, depth: number): React.ReactNode {
    const selected = selectedId != null && node.id === selectedId;
    const hasChildren = Boolean(node.children?.length);
    const expanded = hasChildren ? expandedIds.has(node.id) : false;

    const setExpanded = (nextExpanded: boolean) => {
      if (!hasChildren) return;
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (nextExpanded) next.add(node.id);
        else next.delete(node.id);
        return next;
      });
    };

    const toggleExpanded = () => {
      setExpanded(!expanded);
    };

    const content = renderNode ? (
      renderNode({
        node,
        depth,
        selected,
        hasChildren,
        expanded,
        toggleExpanded,
        setExpanded,
      })
    ) : (
      <div className="flex items-center" style={{ paddingLeft: 8 + depth * indentPx }}>
        {hasChildren ? (
          <button
            type="button"
            className={cn(
              "mr-1 h-7 w-7 rounded-md text-sm text-muted-foreground",
              "hover:bg-accent hover:text-accent-foreground",
            )}
            aria-label={expanded ? "收起" : "展开"}
            aria-expanded={expanded}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="mr-1 h-7 w-7" aria-hidden="true" />
        )}
        <div
          className={cn(
            "w-full rounded-md px-2 py-2 text-sm",
            selected && "bg-accent text-accent-foreground",
            "hover:bg-accent hover:text-accent-foreground",
          )}
          onClick={() => onSelect?.(node)}
        >
          {node.label}
        </div>
      </div>
    );

    return (
      <React.Fragment key={node.id}>
        {content}
        {hasChildren && expanded ? (
          <div className="space-y-1">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        ) : null}
      </React.Fragment>
    );
  }

  return <div className={cn("space-y-1", className)}>{nodes.map((n) => renderTreeNode(n, 0))}</div>;
}
