import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { PageVersionsScreen } from '@/features/page-versions/page-versions-screen';

const ACCESS_TOKEN_COOKIE = 'ctxa_access_token';

export default async function PageVersionsRoute(props: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value);
  if (!isLoggedIn) redirect('/login');

  const params = await props.params;
  return <PageVersionsScreen pageId={params.id} />;
}
