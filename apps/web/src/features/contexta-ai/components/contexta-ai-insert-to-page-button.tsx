import { useCallback, useState } from 'react';

import { CreateSpaceModal } from '@/components/space/create-space-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n/provider';
import type { SpaceDto } from '@/lib/api';
import { usePagesStore, useSpaceStore } from '@/stores';
import { ChevronDown, FileText, Loader2, Plus } from 'lucide-react';

import { useInsertToPage } from '@/features/contexta-ai/hooks/use-insert-to-page';
import { ContextaAiCreateDocumentModal } from './contexta-ai-create-document-modal';

type SpaceOption = {
  id: string;
  name: string;
};

export function ContextaAiInsertToPageButton(props: {
  spaces: SpaceOption[];
  markdownContent: string;
  conversationTitle: string;
}) {
  const { t } = useI18n();
  const [spaceModalOpen, setSpaceModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentModalKey, setDocumentModalKey] = useState(0);
  const [documentSpaceId, setDocumentSpaceId] = useState<string | null>(null);
  const [loadFailedBySpaceId, setLoadFailedBySpaceId] = useState<
    Record<string, boolean>
  >({});

  const pagesBySpaceId = usePagesStore((s) => s.pagesBySpaceId);
  const loadedBySpaceId = usePagesStore((s) => s.loadedBySpaceId);
  const loadingBySpaceId = usePagesStore((s) => s.loadingBySpaceId);
  const ensureLoaded = usePagesStore((s) => s.ensureLoaded);

  const { pending, suggestedTitle, insertToPage, createDocumentInSpace } =
    useInsertToPage({
      markdownContent: props.markdownContent,
      conversationTitle: props.conversationTitle,
    });

  const loadPages = useCallback(
    async (spaceId: string, options?: { force?: boolean }) => {
      try {
        await ensureLoaded(spaceId, options);
        setLoadFailedBySpaceId((prev) =>
          prev[spaceId] ? { ...prev, [spaceId]: false } : prev,
        );
      } catch {
        setLoadFailedBySpaceId((prev) => ({ ...prev, [spaceId]: true }));
      }
    },
    [ensureLoaded],
  );

  const openCreateDocumentModal = useCallback((spaceId: string) => {
    setDocumentModalKey((current) => current + 1);
    setDocumentSpaceId(spaceId);
    setDocumentModalOpen(true);
  }, []);

  const handleCreateDocumentConfirm = useCallback(
    async (input: { title: string; markdownContent: string }) => {
      const spaceId = documentSpaceId;
      if (!spaceId) return false;

      const ok = await createDocumentInSpace({
        spaceId,
        title: input.title,
        markdownContent: input.markdownContent,
        publish: true,
      });
      if (!ok) return false;

      setDocumentModalOpen(false);
      setDocumentSpaceId(null);
      return true;
    },
    [createDocumentInSpace, documentSpaceId],
  );

  const handleDocumentModalOpenChange = useCallback((open: boolean) => {
    setDocumentModalOpen(open);
    if (!open) setDocumentSpaceId(null);
  }, []);

  const handleSpaceCreated = useCallback(
    (created: SpaceDto) => {
      useSpaceStore.setState((prev) => {
        const exists = prev.spaces.some((space) => space.id === created.id);
        if (exists) return prev;

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
              metadata,
            },
            ...prev.spaces,
          ],
        };
      });
      openCreateDocumentModal(created.id);
    },
    [openCreateDocumentModal],
  );

  if (!props.markdownContent.trim()) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="outline" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {t('contextaAiInsert.insertToDoc')}
            <ChevronDown className="h-4 w-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>{t('contextaAiInsert.selectSpace')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={pending}
              onSelect={() => {
                setSpaceModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('contextaAiInsert.newSpace')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          {props.spaces.length === 0 ? (
            <DropdownMenuItem disabled>{t('contextaAiInsert.noSpaces')}</DropdownMenuItem>
          ) : (
            props.spaces.map((space) => {
              const pages = pagesBySpaceId[space.id] ?? [];
              const loading = Boolean(loadingBySpaceId[space.id]);
              const loaded = Boolean(loadedBySpaceId[space.id]);
              const loadFailed = Boolean(loadFailedBySpaceId[space.id]);

              return (
                <DropdownMenuSub
                  key={space.id}
                  onOpenChange={(open) => {
                    if (!open) return;
                    if (loaded || loading) return;
                    void loadPages(space.id);
                  }}
                >
                  <DropdownMenuSubTrigger>{space.name}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52">
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        disabled={pending}
                        onSelect={() => {
                          openCreateDocumentModal(space.id);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        {t('contextaAiInsert.newDocument')}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    {loading ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('contextaAiInsert.loading')}
                        </DropdownMenuItem>
                      </>
                    ) : null}

                    {!loading && loadFailed ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={pending}
                          onSelect={(event) => {
                            event.preventDefault();
                            void loadPages(space.id, { force: true });
                          }}
                        >
                          {t('contextaAiInsert.loadPagesFailed')}
                        </DropdownMenuItem>
                      </>
                    ) : null}

                    {!loading && !loadFailed && loaded && pages.length > 0 ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <div className="max-h-56 overflow-y-auto">
                            {pages.map((page) => (
                              <DropdownMenuItem
                                key={page.id}
                                disabled={pending}
                                onSelect={() => {
                                  void insertToPage(space.id, page.id);
                                }}
                              >
                                {page.title?.trim() || t('contextaAiInsert.untitled')}
                              </DropdownMenuItem>
                            ))}
                          </div>
                        </DropdownMenuGroup>
                      </>
                    ) : null}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateSpaceModal
        open={spaceModalOpen}
        onOpenChange={setSpaceModalOpen}
        onCreated={handleSpaceCreated}
      />

      <ContextaAiCreateDocumentModal
        key={documentModalKey}
        open={documentModalOpen}
        pending={pending}
        initialTitle={suggestedTitle}
        markdownContent={props.markdownContent}
        onOpenChange={handleDocumentModalOpenChange}
        onConfirm={handleCreateDocumentConfirm}
      />
    </>
  );
}
