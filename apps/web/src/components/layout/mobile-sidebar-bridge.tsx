'use client';

import { useCallback, useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { useMobileSidebarControllerStore } from '@/stores/mobile-sidebar-controller-store';

export function MobileSidebarBridge(props: { id: string; label: string }) {
  const { isMobile, openMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const upsertController = useMobileSidebarControllerStore(
    (s) => s.upsertController,
  );
  const removeController = useMobileSidebarControllerStore(
    (s) => s.removeController,
  );

  const open = useCallback(() => {
    setOpenMobile(true);
  }, [setOpenMobile]);

  const close = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  useEffect(() => {
    upsertController({
      id: props.id,
      label: props.label,
      isMobile,
      openMobile,
      toggle: toggleSidebar,
      open,
      close,
    });
  }, [
    close,
    isMobile,
    open,
    openMobile,
    props.id,
    props.label,
    toggleSidebar,
    upsertController,
  ]);

  useEffect(() => {
    return () => {
      removeController(props.id);
    };
  }, [props.id, removeController]);

  return null;
}
