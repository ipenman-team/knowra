import { cookies } from 'next/headers';

import { AppHome } from './app-home';
import { LandingHome } from './landing-home';

const MOCK_AUTH_COOKIE = 'ctxa_mock_auth';

export default async function Page() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get(MOCK_AUTH_COOKIE)?.value === '1';
  return isLoggedIn ? <AppHome /> : <LandingHome />;
}
