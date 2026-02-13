'use client';

import { useSpaceShareBasic } from './use-space-share-basic';
import { useSpaceShareSiteBuilder } from './use-space-share-site-builder';

export function useSpaceSharePageState(spaceId: string) {
  const basic = useSpaceShareBasic(spaceId);
  const siteBuilder = useSpaceShareSiteBuilder({
    spaceId,
    share: basic.share,
    externalBusy: basic.submitting,
  });

  return {
    ...basic,
    ...siteBuilder,
  };
}
