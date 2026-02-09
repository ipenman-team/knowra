import { PageVersionsScreen } from '@/features/page-versions/page-versions-screen';

export default async function PageVersionsPage({
  params,
}: {
  params: { pageId: string };
}) {
  const pageId = (await params).pageId;
  return <PageVersionsScreen pageId={pageId} />;
}
