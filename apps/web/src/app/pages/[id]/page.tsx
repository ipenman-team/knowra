import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { HomeScreen } from '@/app/app-home';

const ACCESS_TOKEN_COOKIE = 'ctxa_access_token';

export default async function PageDetailRoute(props: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value);
  if (!isLoggedIn) redirect('/login');

  const params = await props.params;
  return <HomeScreen initialSelectedPageId={params.id} />;
}
