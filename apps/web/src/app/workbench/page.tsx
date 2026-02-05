import { cookies } from 'next/headers';

import { HomeScreen } from '../app-home';
import { LandingHome } from '../landing-home';

const ACCESS_TOKEN_COOKIE = 'ctxa_access_token';

export default async function WorkbenchPage() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value);

  if (!isLoggedIn) {
    return <LandingHome />;
  }

  return <HomeScreen initialSelectedViewId="workbench" />;
}
