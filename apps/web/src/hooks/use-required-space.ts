"use client";

import { useEffect } from 'react';
import { useCurrentSpaceId, useSpaceStore } from '@/stores';

export function useRequiredSpaceId() {
  const spaceId = useCurrentSpaceId();
  const ensureLoaded = useSpaceStore((s) => s.ensureLoaded);
  const loaded = useSpaceStore((s) => s.loaded);
  const loading = useSpaceStore((s) => s.loading);

  useEffect(() => {
    if (!loaded && !loading) {
      void ensureLoaded();
    }
  }, [ensureLoaded, loaded, loading]);

  return spaceId;
}
