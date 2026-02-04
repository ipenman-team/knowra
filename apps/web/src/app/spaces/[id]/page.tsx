import { ContainerLayout } from '@/components/layout';
import { HomeSidebar } from '@/components/sidebar';
import { SpacePageClient } from '@/components/space/space-container';

export default async function SpacePage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = (await params) as { id: string };
  return (
    <ContainerLayout isRoot sidebar={<HomeSidebar />}>
      <SpacePageClient spaceId={id} />
    </ContainerLayout>
  );
}
