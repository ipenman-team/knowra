'use client';

import { RecycleBin } from '@/components/space/views/recycle-bin';
import { useCurrentSpaceId } from '@/stores';

export default function TrashPage() {
  const spaceId = useCurrentSpaceId();

  if (!spaceId) {
    return null;
  }

  return <RecycleBin spaceId={spaceId} />;
}
