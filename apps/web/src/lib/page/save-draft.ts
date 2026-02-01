import { pagesApi, type PageDto } from '@/lib/api';
import {
  usePageContentStore,
  usePageStore,
  usePagesStore,
  usePageTreeStore,
} from '@/stores';

export async function saveDraft(args: {
  spaceId: string;
  pageId: string;
  title: string;
  content: unknown;
}): Promise<PageDto> {
  const saved = await pagesApi.save(args.spaceId, args.pageId, {
    title: args.title,
    content: args.content,
  });

  usePageStore.getState().patchPage(saved);
  usePagesStore.getState().upsertPage(saved.spaceId, saved);
  usePagesStore.getState().upsertTreePage(saved.spaceId, saved);
  usePageTreeStore.getState().updateNode(saved.id, {
    label: saved.title,
    data: saved,
  });

  usePageContentStore.getState().setLastSavedAt(
    new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  );

  return saved;
}
