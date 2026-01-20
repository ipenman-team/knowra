import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePageSelectionStore } from '@/stores';

/**
 * Syncs the URL with the current selection state
 * Keeps the browser URL in sync with selected page/view
 */
export function useUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const selected = usePageSelectionStore((s) => s.selected);

  useEffect(() => {
    if (pathname.startsWith('/page/')) return;

    if (selected.kind === 'page') {
      const editing = pathname.startsWith('/pages/') && pathname.endsWith('/edit');
      const target = editing
        ? `/pages/${encodeURIComponent(selected.id)}/edit`
        : `/pages/${encodeURIComponent(selected.id)}`;
      if (pathname !== target) router.replace(target);
      return;
    }

    const target =
      selected.id === 'dashboard'
        ? '/'
        : selected.id === 'settings'
          ? '/settings'
          : '/contexta-ai';
    if (pathname !== target) router.replace(target);
  }, [pathname, router, selected]);
}
