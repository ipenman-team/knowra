'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRightIcon,
  FileTextIcon,
  FolderIcon,
  FolderPlusIcon,
  GraduationCapIcon,
  HistoryIcon,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { CreateSpaceModal } from '@/components/space/create-space-modal';
import { pagesApi } from '@/lib/api';
import type { SpaceDto } from '@/lib/api';
import { useI18n } from '@/lib/i18n/provider';
import { useNavigation } from '@/lib/navigation';
import { usePagesStore, useSpaceStore, useSpaces } from '@/stores';
import { CreateDocumentFromWorkbenchModal } from './create-document-from-workbench-modal';
import { useWorkbenchRecentVisits } from '../hooks/use-workbench-recent-visits';

const LEARNING_CARDS = [
  {
    id: 'ai',
    titleKey: '如何使用 Knowra AI',
    descriptionKey: 'workbench.home.learningCard.customize.description',
    href: 'http://contexta.linkmind.site/share/ljY3I3vsdgE',
  },
  {
    id: 'editor',
    titleKey: '富文本编辑器入门',
    descriptionKey: 'workbench.home.learningCard.blocks.description',
    href: 'http://contexta.linkmind.site/share/ljY3I3vsdgE',
  },
  {
    id: 'sharing',
    titleKey: '页面共享与空间共享',
    descriptionKey: 'workbench.home.learningCard.sharing.description',
    href: 'http://contexta.linkmind.site/share/ljY3I3vsdgE',
  },
  {
    id: 'feedback',
    titleKey: '反馈与支持指南',
    descriptionKey: 'workbench.home.learningCard.ai.description',
    href: 'http://contexta.linkmind.site/share/ljY3I3vsdgE',
  },
] as const;

export function WorkbenchHomePanel(props: { actorUserId?: string }) {
  const { t, locale } = useI18n();
  const { navigateToPage, navigateToSpace } = useNavigation();
  const spaces = useSpaces();
  const ensureSpacesLoaded = useSpaceStore((s) => s.ensureLoaded);
  const [createDocumentOpen, setCreateDocumentOpen] = useState(false);
  const [creatingDocument, setCreatingDocument] = useState(false);
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const { items: recentVisits, loading, error } = useWorkbenchRecentVisits({
    actorUserId: props.actorUserId,
    limit: 20,
    enabled: Boolean(props.actorUserId),
  });

  useEffect(() => {
    void ensureSpacesLoaded();
  }, [ensureSpacesLoaded]);

  const recentTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [locale],
  );

  const spaceOptions = useMemo(
    () =>
      spaces.map((space) => ({
        id: space.id,
        name: space.name,
      })),
    [spaces],
  );
  const spaceNameById = useMemo(
    () =>
      new Map(
        spaces.map((space) => [space.id, space.name?.trim() || space.id] as const),
      ),
    [spaces],
  );

  const handleCreateDocument = async (spaceId: string) => {
    setCreatingDocument(true);
    try {
      const created = await pagesApi.create({
        title: t('pageHeader.untitledDoc'),
        spaceId,
      });
      usePagesStore.getState().upsertPage(spaceId, created);
      usePagesStore.getState().upsertTreePage(spaceId, created);
      setCreateDocumentOpen(false);
      navigateToPage(spaceId, created.id, { mode: 'edit' });
      return true;
    } catch {
      return false;
    } finally {
      setCreatingDocument(false);
    }
  };

  const handleSpaceCreated = (created: SpaceDto) => {
    setCreateSpaceOpen(false);
    useSpaceStore.setState((prev) => {
      const exists = prev.spaces.some((space) => space.id === created.id);
      if (exists) {
        return { ...prev, currentSpaceId: created.id };
      }

      const metadata =
        created.metadata &&
        typeof created.metadata === 'object' &&
        !Array.isArray(created.metadata)
          ? (created.metadata as Record<string, unknown>)
          : null;

      return {
        spaces: [
          {
            id: created.id,
            name: created.name,
            color: created.color ?? null,
            type: created.type ?? null,
            metadata,
          },
          ...prev.spaces,
        ],
        currentSpaceId: created.id,
      };
    });

    navigateToSpace(created.id);
  };

  return (
    <>
      <div className="flex min-h-0 flex-col gap-8 lg:h-full lg:overflow-y-auto">
        <section className="space-y-4">
          <div className="text-sm font-semibold text-muted-foreground">
            {t('workbench.home.quickActions')}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              aria-label={t('workbench.home.newDocument')}
              className="group flex w-full items-center justify-between gap-3 rounded-md bg-card p-4 text-left transition-colors hover:bg-accent/20"
              onClick={() => setCreateDocumentOpen(true)}
            >
              <div className="space-y-1">
                <div className="text-base font-semibold">
                  {t('workbench.home.newDocument')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('workbench.home.newDocumentDescription')}
                </div>
              </div>
              <FileTextIcon className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </button>

            <button
              type="button"
              aria-label={t('workbench.home.newSpace')}
              className="group flex w-full items-center justify-between gap-3 rounded-md bg-card p-4 text-left transition-colors hover:bg-accent/20"
              onClick={() => setCreateSpaceOpen(true)}
            >
              <div className="space-y-1">
                <div className="text-base font-semibold">
                  {t('workbench.home.newSpace')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('workbench.home.newSpaceDescription')}
                </div>
              </div>
              <FolderPlusIcon className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <HistoryIcon className="h-4 w-4" />
            {t('workbench.home.recentVisits')}
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-full gap-3">
              {loading ? (
                <Card className="w-full min-w-[220px] rounded-md border-0 bg-muted/40 shadow-none">
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    {t('common.loading')}
                  </CardContent>
                </Card>
              ) : error ? (
                <Card className="w-full min-w-[220px] rounded-md border-0 bg-muted/40 shadow-none">
                  <CardContent className="p-4 text-sm text-destructive">
                    {error}
                  </CardContent>
                </Card>
              ) : recentVisits.length === 0 ? (
                <Card className="w-full min-w-[220px] rounded-md border-0 bg-muted/40 shadow-none">
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    {t('workbench.home.recentEmpty')}
                  </CardContent>
                </Card>
              ) : (
                recentVisits.map((visit) => (
                  <button
                    key={visit.pageId}
                    type="button"
                    data-testid="workbench-recent-visit-card"
                    className="group min-w-[248px] shrink-0 rounded-md bg-card p-4 text-left transition-colors hover:bg-accent/20"
                    onClick={() => navigateToPage(visit.spaceId, visit.pageId)}
                  >
                    <div className="line-clamp-2 text-base font-semibold leading-snug">
                      {visit.title?.trim() || t('pageHeader.untitledDoc')}
                    </div>
                    <div className="mt-3 inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      <FolderIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {spaceNameById.get(visit.spaceId) ??
                          visit.spaceName ??
                          visit.spaceId}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {recentTimeFormatter.format(new Date(visit.visitedAt))}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <GraduationCapIcon className="h-4 w-4" />
            {t('workbench.home.learning')}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {LEARNING_CARDS.map((card) => (
              <a
                key={card.id}
                href={card.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-md bg-card p-4 transition-colors hover:bg-accent/20"
                title={t('workbench.home.openInNewWindow')}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-base font-semibold transition-colors group-hover:text-primary">
                    {t(card.titleKey)}
                  </div>
                  <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {t(card.descriptionKey)}
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>

      <CreateDocumentFromWorkbenchModal
        open={createDocumentOpen}
        pending={creatingDocument}
        spaces={spaceOptions}
        onOpenChange={setCreateDocumentOpen}
        onConfirm={handleCreateDocument}
      />

      <CreateSpaceModal
        open={createSpaceOpen}
        onOpenChange={setCreateSpaceOpen}
        onCreated={handleSpaceCreated}
      />
    </>
  );
}
