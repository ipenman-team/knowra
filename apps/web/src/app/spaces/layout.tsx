import { HomeSidebar } from '@/components/sidebar';
import { ContainerLayout } from '@/components/layout';
import { SpaceLayoutClient } from '@/components/space/space-layout';

export default function SpacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ContainerLayout isRoot sidebar={<HomeSidebar />}>
      <SpaceLayoutClient>{children}</SpaceLayoutClient>
    </ContainerLayout>
  );
}
