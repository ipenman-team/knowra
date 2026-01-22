import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { PageVersionsScreen } from '@/features/page-versions/page-versions-screen';

const MOCK_AUTH_COOKIE = 'ctxa_mock_auth';

export default async function PageVersionsRoute(props: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get(MOCK_AUTH_COOKIE)?.value === '1';
  if (!isLoggedIn) redirect('/login');

  const params = await props.params;
  return <PageVersionsScreen pageId={params.id} />;
}
