'use client';

import React, { useEffect } from 'react';

import { usePageStoreSync } from '@/hooks';

import { HomeLayout } from '@/components/layout';
import { HomeSidebar } from '@/components/sidebar';

import SpaceMain from '@/components/space/space-main';
import { useSpaceStore } from '@/stores';
import { SpaceSidebar } from '@/components/space/space-sidebar';

export default function SpaceInfo({ spaceId }: { spaceId: string }) {
  const setCurrent = useSpaceStore((s) => s.setCurrentSpaceId);

  usePageStoreSync();

  useEffect(() => {
    if (spaceId) setCurrent(spaceId);
  }, [spaceId, setCurrent]);

  return (
    <HomeLayout sidebar={<HomeSidebar />}>
      <div className="flex h-full min-h-0 overflow-hidden">
        <SpaceSidebar />
        <div className="flex-1 min-h-0 overflow-auto">
          <SpaceMain spaceId={spaceId} />
        </div>
      </div>
    </HomeLayout>
  );
}
