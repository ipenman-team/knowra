'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { useMeStore } from '@/stores';

const PROTECTED_PREFIXES = ['/workbench', '/spaces', '/contexta-ai'];

function isProtectedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function MeStoreInit(): null {
  const pathname = usePathname();
  const ensureMeLoaded = useMeStore((s) => s.ensureLoaded);

  useEffect(() => {
    if (!isProtectedPath(pathname)) return;
    void ensureMeLoaded();
  }, [ensureMeLoaded, pathname]);

  return null;
}
