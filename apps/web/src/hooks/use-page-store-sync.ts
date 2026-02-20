import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { usePageSelectionStore } from '@/stores/page-selection-store';
import { usePageStore } from '@/stores/page-store';
import { usePageContentStore } from '@/stores/page-content-store';

/**
 * 在页面/模块切换时维护 pageStore 生命周期：
 * - 选中 page -> 拉取详情并写入 stores
 * - 切换到 view/其他模块 -> 销毁 pageStore
 */
export function usePageStoreSync() {
  const searchParams = useSearchParams();
  const selected = usePageSelectionStore((s) => s.selected);
  const ensureLoaded = usePageStore((s) => s.ensureLoaded);
  const destroy = usePageStore((s) => s.destroy);
  const setPageMode = usePageContentStore((s) => s.setPageMode);

  const selectedPageId = selected.kind === 'page' ? selected.id : null;
  const modeQuery = searchParams.get('mode');
  const targetMode = modeQuery === 'edit' ? 'edit' : 'preview';

  useEffect(() => {
    if (!selectedPageId) {
      destroy();
      return;
    }

    let cancelled = false;
    void (async () => {
      const page = await ensureLoaded(selectedPageId);
      if (cancelled || !page) return;
      setPageMode(targetMode);
    })();

    return () => {
      cancelled = true;
    };
  }, [destroy, ensureLoaded, selectedPageId, setPageMode, targetMode]);

  useEffect(() => destroy, [destroy]);
}
