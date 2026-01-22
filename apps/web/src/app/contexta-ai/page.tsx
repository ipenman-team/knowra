import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { HomeScreen } from '@/app/app-home';

const ACCESS_TOKEN_COOKIE = 'ctxa_access_token';

export default async function ContextaAiRoute() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value);
  if (!isLoggedIn) redirect('/login');
  return <HomeScreen initialSelectedViewId="contexta-ai" />;
}
