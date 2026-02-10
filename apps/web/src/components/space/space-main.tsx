"use client";

import { useSpaceSection } from '@/stores';
import { SpaceDirectoryView, SpacePagesView } from '@/components/space/views';

export default function SpaceMain(props: { spaceId: string }) {
  const section = useSpaceSection();
  if (section === 'directory') {
    return <SpaceDirectoryView spaceId={props.spaceId} />;
  }

  return <SpacePagesView spaceId={props.spaceId} />;
}
