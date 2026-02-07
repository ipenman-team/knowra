import SpaceMain from '@/components/space/space-main';

export default async function SpacePage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = (await params) as { id: string };
  return <SpaceMain spaceId={id} />;
}
