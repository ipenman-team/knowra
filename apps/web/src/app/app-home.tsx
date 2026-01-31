'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

import { HomeLayout } from '@/components/layout';
import { HomeSidebar } from '@/components/sidebar';
import { MainContent } from '@/features/home/components/main-content';

import { useMeStore, useSpaceStore } from '@/stores';

import { useUrlSync } from '@/hooks';

import type { ViewId } from '@/features/home/types';

export function AppHome() {
  return <HomeScreen />;
}

export function HomeScreen(props: {} = {}) {
  const ensureMeLoaded = useMeStore((s) => s.ensureLoaded);
  const ensureSpacesLoaded = useSpaceStore((s) => s.ensureLoaded);

  useEffect(() => {
    void ensureMeLoaded();
    void ensureSpacesLoaded();
  }, [ensureMeLoaded, ensureSpacesLoaded]);

  useUrlSync();
  return (
    <HomeLayout sidebar={<HomeSidebar />}>
      <div className={cn('px-6 lg:px-11')}>
        <MainContent />
      </div>
    </HomeLayout>
  );
}
