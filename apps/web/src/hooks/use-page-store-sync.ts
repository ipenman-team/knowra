import { useEffect } from 'react';

import { usePageSelectionStore } from '@/stores/page-selection-store';
import { usePageStore } from '@/stores/page-store';

/**
 * 在页面/模块切换时维护 pageStore 生命周期：
 * - 选中 page -> 拉取详情并写入 stores
 * - 切换到 view/其他模块 -> 销毁 pageStore
 */
export function usePageStoreSync() {
  const selected = usePageSelectionStore((s) => s.selected);
  const ensureLoaded = usePageStore((s) => s.ensureLoaded);
  const destroy = usePageStore((s) => s.destroy);

  const selectedPageId = selected.kind === 'page' ? selected.id : null;

  useEffect(() => {
    if (!selectedPageId) {
      destroy();
      return;
    }
    void ensureLoaded(selectedPageId);
  }, [destroy, ensureLoaded, selectedPageId]);

  useEffect(() => destroy, [destroy]);
}
