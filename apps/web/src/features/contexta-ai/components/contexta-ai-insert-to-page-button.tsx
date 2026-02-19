import { useCallback, useState } from 'react';

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
import { usePagesStore } from '@/stores';
import { ChevronDown, FileText, Loader2, Plus } from 'lucide-react';

import { useInsertToPage } from '@/features/contexta-ai/hooks/use-insert-to-page';

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
  const [loadFailedBySpaceId, setLoadFailedBySpaceId] = useState<
    Record<string, boolean>
  >({});

  const pagesBySpaceId = usePagesStore((s) => s.pagesBySpaceId);
  const loadedBySpaceId = usePagesStore((s) => s.loadedBySpaceId);
  const loadingBySpaceId = usePagesStore((s) => s.loadingBySpaceId);
  const ensureLoaded = usePagesStore((s) => s.ensureLoaded);

  const { pending, insertToPage, createDocumentInSpace } = useInsertToPage({
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

  if (!props.markdownContent.trim()) return null;

  return (
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
                        void createDocumentInSpace(space.id);
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
  );
}
