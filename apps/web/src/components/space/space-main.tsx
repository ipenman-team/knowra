"use client";

import { useMemo } from 'react';
import { useSpaces, useCurrentSpaceId, usePageTreeNodes, useSelectedPageId } from '@/stores';
import { Tree } from '@/components/shared/tree';
import { PageTreeItem } from '@/components/page-tree/components/tree-item';
import { buildPageTreeFromFlatPages } from '@contexta/shared';
import type { PageDto } from '@/lib/api';

export default function SpaceMain() {
  const spaces = useSpaces();
  const currentId = useCurrentSpaceId();
  const nodes = usePageTreeNodes();
  const selectedPageId = useSelectedPageId();

  const space = spaces.find((s) => s.id === currentId);

  // mock flat pages when API / store has no nodes
  const nodesToRender = useMemo(() => {
    if (nodes && nodes.length > 0) return nodes;

    const now = new Date().toISOString();
    const flat: PageDto[] = [
      { id: 'd1', tenantId: 't', title: '标签一', content: null, parentIds: [], createdAt: now, updatedAt: now },
      { id: 'p1', tenantId: 't', title: '概览', content: null, parentIds: ['d1'], createdAt: now, updatedAt: now },
      { id: 'p2', tenantId: 't', title: '使用指南', content: null, parentIds: ['d1'], createdAt: now, updatedAt: now },
      { id: 'd2', tenantId: 't', title: '项目', content: null, parentIds: [], createdAt: now, updatedAt: now },
      { id: 'p3', tenantId: 't', title: '项目计划', content: null, parentIds: ['d2'], createdAt: now, updatedAt: now },
    ];

    return buildPageTreeFromFlatPages(flat);
  }, [nodes]);

  const docCount = (() => {
    let c = 0;
    const walk = (ns: any[]) => {
      for (const n of ns) {
        c += 1;
        if (n.children) walk(n.children);
      }
    };
    walk(nodesToRender);
    return c;
  })();

  return (
    <div>
      <div className="bg-card rounded p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xl">📘</div>
          <div>
            <div className="text-2xl font-semibold">{space?.name ?? '空间'}</div>
            <div className="text-sm text-muted-foreground">{docCount} 文档</div>
          </div>
        </div>
      </div>

      <div>
        <Tree<PageDto>
          nodes={nodesToRender}
          selectedId={selectedPageId ?? undefined}
          renderNode={(ctx) => <PageTreeItem {...ctx} />}
        />
      </div>
    </div>
  );
}
