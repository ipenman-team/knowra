import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ContainerLayout } from '@/components/layout';
import { HomeSidebar } from '@/components/sidebar';
import { FavoritesContainer } from '@/features/favorites';

const ACCESS_TOKEN_COOKIE = 'ctxa_access_token';

export default async function FavoritesPage() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value);
  if (!isLoggedIn) redirect('/login');

  return (
    <ContainerLayout stateId="home" isRoot sidebar={<HomeSidebar />}>
      <FavoritesContainer />
    </ContainerLayout>
  );
}
