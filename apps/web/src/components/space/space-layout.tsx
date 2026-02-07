'use client';

import { useEffect, ReactNode } from 'react';
import { usePageStoreSync } from '@/hooks';
import { ContainerLayout } from '@/components/layout/container-layout';
import { useSpaceStore } from '@/stores';
import { SpaceSidebar } from '@/components/space/space-sidebar';

export const SpaceLayoutClient = ({
  spaceId,
  children,
}: {
  spaceId?: string;
  children: ReactNode;
}) => {
  const setCurrent = useSpaceStore((s) => s.setCurrentSpaceId);

  usePageStoreSync();

  useEffect(() => {
    if (spaceId) setCurrent(spaceId);
  }, [spaceId, setCurrent]);

  return (
    <ContainerLayout
      stateId="space"
      defaultWidthRem={18}
      className="h-full min-h-0 overflow-hidden bg-transparent"
      insetClassName="min-h-0 overflow-hidden"
      sidebar={<SpaceSidebar />}
    >
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </ContainerLayout>
  );
};
