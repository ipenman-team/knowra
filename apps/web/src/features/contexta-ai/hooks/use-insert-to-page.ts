import { useCallback, useMemo, useState } from 'react';

import { markdownToSlateValue } from '@contexta/slate-converters';
import { toast } from 'sonner';

import { parseContentToSlateValue } from '@/components/shared/slate-editor';
import { pagesApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n/provider';
import { usePagesStore } from '@/stores';

const PAGE_TITLE_MAX_LENGTH = 30;
type CreateDocumentInSpaceInput = {
  spaceId: string;
  title?: string;
  publish?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isPlaceholderParagraphOnly(nodes: unknown[]): boolean {
  if (nodes.length !== 1) return false;
  const first = nodes[0];
  if (!isRecord(first) || first.type !== 'paragraph') return false;

  const children = first.children;
  if (!Array.isArray(children) || children.length !== 1) return false;

  const child = children[0];
  if (!isRecord(child) || typeof child.text !== 'string') return false;
  return child.text.length === 0;
}

function stripMarkdownTitlePrefix(line: string): string {
  return line
    .replace(/^\s*#{1,6}\s+/, '')
    .replace(/^\s*>\s?/, '')
    .replace(/^\s*[-*+]\s+/, '')
    .replace(/^\s*\d+[.)]\s+/, '')
    .trim();
}

export function buildPageTitle(args: {
  markdownContent: string;
  conversationTitle: string;
  fallbackTitle: string;
}): string {
  const firstLine = args.markdownContent
    .split('\n')
    .map(stripMarkdownTitlePrefix)
    .find((line) => line.length > 0);

  const rawTitle = firstLine || args.conversationTitle.trim() || args.fallbackTitle;
  const sliced = rawTitle.slice(0, PAGE_TITLE_MAX_LENGTH).trim();
  return sliced || args.fallbackTitle;
}

export function useInsertToPage(args: {
  markdownContent: string;
  conversationTitle: string;
}) {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);
  const suggestedTitle = useMemo(
    () =>
      buildPageTitle({
        markdownContent: args.markdownContent,
        conversationTitle: args.conversationTitle,
        fallbackTitle: t('contextaAiInsert.untitled'),
      }),
    [args.conversationTitle, args.markdownContent, t],
  );

  const insertToPage = useCallback(
    async (spaceId: string, pageId: string): Promise<boolean> => {
      if (pending) return false;

      const markdownContent = args.markdownContent.trim();
      if (!markdownContent) return false;

      setPending(true);
      try {
        const page = await pagesApi.get(spaceId, pageId);
        const existing = parseContentToSlateValue(page.content) as unknown[];
        const normalizedExisting = isPlaceholderParagraphOnly(existing)
          ? []
          : existing;
        const newNodes = markdownToSlateValue(markdownContent) as unknown[];
        const merged = [...normalizedExisting, ...newNodes];

        const saved = await pagesApi.save(spaceId, pageId, { content: merged });
        const pagesStore = usePagesStore.getState();
        pagesStore.upsertPage(saved.spaceId, saved);
        pagesStore.upsertTreePage(saved.spaceId, saved);

        toast.success(t('contextaAiInsert.insertSuccess'));
        return true;
      } catch {
        toast.error(t('contextaAiInsert.insertFailed'));
        return false;
      } finally {
        setPending(false);
      }
    },
    [args.markdownContent, pending, t],
  );

  const createDocumentInSpace = useCallback(
    async (input: CreateDocumentInSpaceInput): Promise<boolean> => {
      if (pending) return false;

      const markdownContent = args.markdownContent.trim();
      if (!markdownContent) return false;

      const title = input.title?.trim() || suggestedTitle;
      const publish = input.publish !== false;

      setPending(true);
      try {
        const content = markdownToSlateValue(markdownContent) as unknown[];
        const created = await pagesApi.create({
          spaceId: input.spaceId,
          title,
          content,
        });
        let nextPage = created;

        if (publish) {
          try {
            const published = await pagesApi.publish(created.spaceId, created.id);
            nextPage = {
              ...created,
              latestPublishedVersionId: published.versionId,
            };
          } catch {
            const pagesStore = usePagesStore.getState();
            pagesStore.upsertPage(created.spaceId, created);
            pagesStore.upsertTreePage(created.spaceId, created);
            toast.error(t('contextaAiInsert.createPublishFailed'));
            return false;
          }
        }

        const pagesStore = usePagesStore.getState();
        pagesStore.upsertPage(nextPage.spaceId, nextPage);
        pagesStore.upsertTreePage(nextPage.spaceId, nextPage);

        toast.success(t('contextaAiInsert.createSuccess'));
        return true;
      } catch {
        toast.error(t('contextaAiInsert.createFailed'));
        return false;
      } finally {
        setPending(false);
      }
    },
    [args.markdownContent, pending, suggestedTitle, t],
  );

  return {
    pending,
    suggestedTitle,
    insertToPage,
    createDocumentInSpace,
  };
}
