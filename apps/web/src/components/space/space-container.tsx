'use client';

import React, { useEffect } from 'react';

import { HomeLayout } from '@/components/layout';
import { HomeSidebar } from '@/components/sidebar';

import SpaceHeader from '@/components/space/space-header';
import DirectoryList from '@/components/space/directory-list';
import SpaceMain from '@/components/space/space-main';
import { useSpaceStore } from '@/stores';
import { SpaceSidebar } from '@/components/space/space-sidebar';

export default function SpaceInfo({ spaceId }: { spaceId: string }) {
  const setCurrent = useSpaceStore((s) => s.setCurrentSpaceId);

  useEffect(() => {
    if (spaceId) setCurrent(spaceId);
  }, [spaceId, setCurrent]);

  return (
    <HomeLayout sidebar={<HomeSidebar />}>
      <div className="flex h-full min-h-0 overflow-hidden">
        <SpaceSidebar />
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="min-h-0">
            <SpaceHeader />
            <div className="p-6">
              <DirectoryList spaceId={spaceId} />
              <div className="mt-6">
                {/* space main shows directory / pages list */}
                <SpaceMain />
              </div>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
