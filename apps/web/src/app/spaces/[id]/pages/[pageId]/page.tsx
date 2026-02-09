'use client';

import { useEffect } from 'react';
import SpaceMain from '@/components/space/space-main';
import { usePageSelectionStore, useSpaceStore } from '@/stores';

export default function SpacePageItem({
  params,
}: {
  params: { id: string; pageId: string };
}) {
  const { id, pageId } = params;
  const selected = usePageSelectionStore((s) => s.selected);
  const setSelectedPage = usePageSelectionStore((s) => s.setSelectedPage);
  const setCurrent = useSpaceStore((s) => s.setCurrentSpaceId);

  useEffect(() => {
    if (id) setCurrent(id);
  }, [id, setCurrent]);

  useEffect(() => {
    if (!pageId) return;
    if (selected.kind === 'page' && selected.id === pageId) return;
    setSelectedPage(pageId, '');
  }, [pageId, selected, setSelectedPage]);

  return <SpaceMain spaceId={id} />;
}
