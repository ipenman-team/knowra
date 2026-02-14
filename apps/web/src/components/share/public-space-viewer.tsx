'use client';

import { useMemo, useState } from 'react';
import { buildPageTreeFromFlatPages } from '@contexta/shared';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { EditorTitleDisplay } from '@/components/editor/components/title-display';
import { SharePageHeader } from '@/components/share/share-page-header';
import type {
  SpaceShareSnapshotPage,
  SpaceShareSnapshotPayload,
} from '@/components/share/types';
import { SlateEditor, parseContentToSlateValue } from '@/components/shared/slate-editor';
import { Tree } from '@/components/shared/tree';
import { ShareDto } from '@/lib/api';
import { ICP_FILING_NUMBER } from '@/lib/filing';
import { cn } from '@/lib/utils';

function normalizeSnapshotPayload(payload: unknown): SpaceShareSnapshotPayload | null {
  if (!payload || typeof payload !== 'object') return null;

  const raw = payload as {
    space?: {
      id?: unknown;
      name?: unknown;
      description?: unknown;
      color?: unknown;
    };
    pages?: unknown;
    defaultPageId?: unknown;
  };

  const rawPages = Array.isArray(raw.pages) ? raw.pages : [];
  const pages: SpaceShareSnapshotPage[] = [];

  for (const item of rawPages) {
    if (!item || typeof item !== 'object') continue;

    const page = item as {
      id?: unknown;
      title?: unknown;
      parentIds?: unknown;
      content?: unknown;
      updatedAt?: unknown;
    };

    if (typeof page.id !== 'string' || !page.id.trim()) continue;

    pages.push({
      id: page.id,
      title: typeof page.title === 'string' ? page.title : '无标题文档',
      parentIds: Array.isArray(page.parentIds)
        ? page.parentIds.filter((x): x is string => typeof x === 'string')
        : [],
      content: page.content,
      updatedAt: typeof page.updatedAt === 'string' ? page.updatedAt : undefined,
    });
  }

  const spaceName = typeof raw.space?.name === 'string'
    ? raw.space.name
    : '空间共享';
  const spaceId = typeof raw.space?.id === 'string'
    ? raw.space.id
    : 'unknown-space';

  return {
    space: {
      id: spaceId,
      name: spaceName,
      description:
        typeof raw.space?.description === 'string' ? raw.space.description : null,
      color: typeof raw.space?.color === 'string' ? raw.space.color : null,
    },
    pages,
    defaultPageId:
      typeof raw.defaultPageId === 'string' ? raw.defaultPageId : null,
  };
}

export function PublicSpaceViewer({
  snapshot,
}: {
  share: ShareDto;
  snapshot: { payload?: unknown; createdAt?: string } | null;
}) {
  const payload = useMemo(
    () => normalizeSnapshotPayload(snapshot?.payload),
    [snapshot?.payload],
  );
  const pages = useMemo(() => payload?.pages ?? [], [payload?.pages]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const resolvedSelectedPageId = useMemo(() => {
    if (!pages.length) return null;
    if (selectedPageId && pages.some((page) => page.id === selectedPageId)) {
      return selectedPageId;
    }
    if (
      payload?.defaultPageId &&
      pages.some((page) => page.id === payload.defaultPageId)
    ) {
      return payload.defaultPageId;
    }
    return pages[0].id;
  }, [pages, payload?.defaultPageId, selectedPageId]);

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === resolvedSelectedPageId) ?? null,
    [pages, resolvedSelectedPageId],
  );

  const treeNodes = useMemo(
    () => buildPageTreeFromFlatPages(pages),
    [pages],
  );

  const slateValue = useMemo(
    () => parseContentToSlateValue(selectedPage?.content),
    [selectedPage?.content],
  );
  const editorKey = selectedPage
    ? `${selectedPage.id}-${selectedPage.updatedAt ?? 'unknown'}`
    : 'empty';

  if (!payload) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        共享数据异常，无法加载空间内容。
      </div>
    );
  }

  if (!pages.length) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <SharePageHeader title={payload.space.name} publishedAt={snapshot?.createdAt} />
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          此共享空间暂无可展示页面。
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <SharePageHeader title={payload.space.name} />
      <div className="flex min-h-0 flex-1 overflow-hidden flex-col md:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b bg-muted/20 md:w-72 md:border-b-0 md:border-r">
          <div className="h-64 flex-1 overflow-auto p-2 md:h-auto">
            <Tree<SpaceShareSnapshotPage>
              nodes={treeNodes}
              selectedId={selectedPage?.id}
              onSelect={(node) => {
                setSelectedPageId(node.id);
              }}
              renderNode={({ node, depth, hasChildren, expanded, toggleExpanded, selected }) => (
                <div className="flex items-center" style={{ paddingLeft: depth * 12 }}>
                  {hasChildren ? (
                    <button
                      type="button"
                      className="mr-1 inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleExpanded();
                      }}
                      aria-label={expanded ? '收起子页面' : '展开子页面'}
                    >
                      {expanded ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <span className="mr-1 inline-block h-6 w-6" aria-hidden="true" />
                  )}
                  <button
                    type="button"
                    className={cn(
                      'min-w-0 flex-1 truncate rounded px-2 py-1.5 text-left text-sm transition-colors',
                      selected
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground',
                    )}
                    onClick={() => {
                      setSelectedPageId(node.id);
                    }}
                  >
                    {node.label}
                  </button>
                </div>
              )}
            />
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl space-y-4 px-6 pb-20 pt-8">
            <EditorTitleDisplay title={selectedPage?.title ?? '无标题文档'} />
            <SlateEditor
              key={editorKey}
              value={slateValue}
              readOnly
              showToolbar={false}
              onChange={() => {}}
            />
            <div className="border-t pt-8 text-center text-sm text-muted-foreground">
              {ICP_FILING_NUMBER}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
