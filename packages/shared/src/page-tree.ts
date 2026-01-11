export type FlatPageLike = {
  id: string;
  title: string;
  parentIds?: string[] | null;
};

export type TreeNodeLike<TData = unknown> = {
  id: string;
  label: string;
  children?: TreeNodeLike<TData>[];
  data?: TData;
};

function getParentId(page: FlatPageLike): string | undefined {
  const ids = page.parentIds ?? [];
  if (!ids.length) return undefined;
  return ids[ids.length - 1];
}

export function buildPageTreeFromFlatPages<TPage extends FlatPageLike>(
  pages: TPage[],
): TreeNodeLike<TPage>[] {
  const nodeById = new Map<string, TreeNodeLike<TPage>>();

  for (const page of pages) {
    nodeById.set(page.id, {
      id: page.id,
      label: page.title,
      children: [],
      data: page,
    });
  }

  const roots: TreeNodeLike<TPage>[] = [];

  for (const page of pages) {
    const node = nodeById.get(page.id)!;
    const parentId = getParentId(page);

    if (!parentId || parentId === page.id) {
      roots.push(node);
      continue;
    }

    const parent = nodeById.get(parentId);
    if (!parent) {
      roots.push(node);
      continue;
    }

    (parent.children ??= []).push(node);
  }

  const finalize = (n: TreeNodeLike<TPage>): TreeNodeLike<TPage> => {
    if (n.children?.length) {
      n.children = n.children.map(finalize);
    } else {
      delete n.children;
    }
    return n;
  };

  return roots.map(finalize);
}
