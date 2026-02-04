import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import ContextaAiContainer from './contexta-ai-container';
import { ContainerLayout } from '@/components/layout';
import { HomeSidebar } from '@/components/sidebar';

const ACCESS_TOKEN_COOKIE = 'ctxa_access_token';

export default async function ContextaAiRoute() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value);
  if (!isLoggedIn) redirect('/login');
  return (
    <ContainerLayout stateId='home' isRoot sidebar={<HomeSidebar />}>
      <ContextaAiContainer />
    </ContainerLayout>
  );
}
