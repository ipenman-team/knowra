import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { HomeScreen } from '@/app/app-home';

const MOCK_AUTH_COOKIE = 'ctxa_mock_auth';

export default async function SettingsRoute() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get(MOCK_AUTH_COOKIE)?.value === '1';
  if (!isLoggedIn) redirect('/login');
  return <HomeScreen initialSelectedViewId="settings" />;
}
