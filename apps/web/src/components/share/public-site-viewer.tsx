'use client';

import { useMemo } from 'react';
import { SiteTemplateRenderer } from '@/components/site-builder/templates';
import { buildRenderDataFromSnapshot } from './public-site-viewer-data';

export function PublicSiteViewer({
  snapshot,
}: {
  snapshot: { payload?: unknown; createdAt?: string } | null;
}) {
  const renderData = useMemo(
    () => buildRenderDataFromSnapshot(snapshot),
    [snapshot],
  );

  if (!renderData) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        站点配置异常，无法渲染。
      </div>
    );
  }

  return <SiteTemplateRenderer data={renderData} />;
}
