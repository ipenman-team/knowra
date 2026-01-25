import SpacePageClient from '@/components/space/space-container';

export default async function SpacePage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { id } = (await params) as { id: string };
  return <SpacePageClient spaceId={id} />;
}
