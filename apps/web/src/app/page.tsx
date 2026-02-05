import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { LandingHome } from './landing-home';

const ACCESS_TOKEN_COOKIE = 'ctxa_access_token';

export default async function Page() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value);
  if (isLoggedIn) {
    redirect('/workbench');
  }
  return <LandingHome />;
}
