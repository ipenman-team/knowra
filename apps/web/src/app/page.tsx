import { cookies } from 'next/headers';

import { AppHome } from './app-home';
import { LandingHome } from './landing-home';

const ACCESS_TOKEN_COOKIE = 'ctxa_access_token';

export default async function Page() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value);
  return isLoggedIn ? <AppHome /> : <LandingHome />;
}
