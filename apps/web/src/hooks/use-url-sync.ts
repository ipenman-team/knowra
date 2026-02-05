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
    let target = '/workbench';
    if (selected.id === 'settings') {
      target = '/settings';
    } else if (selected.id === 'contexta-ai') {
      target = '/contexta-ai';
    }
    if (pathname !== target) router.replace(target);
  }, [pathname, router, selected]);
}
