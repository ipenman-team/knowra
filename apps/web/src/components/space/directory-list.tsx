"use client";

import { useEffect } from 'react';
import { useSpaceStore } from '@/stores';
import { pagesApi } from '@/lib/api';
import { buildPageTreeFromFlatPages } from '@contexta/shared';
import { usePageTreeStore, usePageSelectionStore } from '@/stores';
import { PageTreeContainer } from '@/components/page-tree/components/tree-container';
import type { PageDto } from '@/lib/api';

export default function DirectoryList({ spaceId }: { spaceId: string }) {
  const setPageTreeNodes = usePageTreeStore((s) => s.setPageTreeNodes);

  useEffect(() => {
    if (!spaceId) {
      // clear tree if no space selected
      setPageTreeNodes([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const pages: PageDto[] = await pagesApi.list(spaceId);
        if (cancelled) return;
        const nodes = buildPageTreeFromFlatPages(pages);
        setPageTreeNodes(nodes);

        // default select first top-level node (directory) if any
        const first = nodes[0];
        if (first && first.id) {
          usePageSelectionStore.setState({ selected: { kind: 'page', id: first.id, title: first.data?.title || '' } });
        }
      } catch (e) {
        if (cancelled) return;
        setPageTreeNodes([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [spaceId, setPageTreeNodes]);

  return (
    <div />
  );
}
