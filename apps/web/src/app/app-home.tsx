'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

import { ContainerLayout } from '@/components/layout';
import { HomeSidebar } from '@/components/sidebar';
import { MainContent } from '@/features/home/components/main-content';

import { useMeStore, useSpaceStore } from '@/stores';
import { usePageSelectionStore } from '@/stores';

import { usePageStoreSync } from '@/hooks';

import type { ViewId } from '@/features/home/types';

export function AppHome() {
  return <HomeScreen />;
}

export function HomeScreen(
  props: {
    initialSelectedViewId?: ViewId;
    initialSelectedPageId?: string;
  } = {},
) {
  const ensureMeLoaded = useMeStore((s) => s.ensureLoaded);
  const ensureSpacesLoaded = useSpaceStore((s) => s.ensureLoaded);
  const setSelectedView = usePageSelectionStore((s) => s.setSelectedView);
  const setSelectedPage = usePageSelectionStore((s) => s.setSelectedPage);

  useEffect(() => {
    void ensureMeLoaded();
    void ensureSpacesLoaded();
  }, [ensureMeLoaded, ensureSpacesLoaded]);

  useEffect(() => {
    if (props.initialSelectedPageId) {
      setSelectedPage(props.initialSelectedPageId, '');
      return;
    }

    if (props.initialSelectedViewId) {
      setSelectedView(props.initialSelectedViewId);
    }
  }, [props.initialSelectedPageId, props.initialSelectedViewId, setSelectedPage, setSelectedView]);

  usePageStoreSync();
  return (
    <ContainerLayout isRoot sidebar={<HomeSidebar />}>
      <div className={cn('px-6 lg:px-11')}>
        <MainContent />
      </div>
    </ContainerLayout>
  );
}
