import type { ReactNode } from 'react';
import { cookies } from 'next/headers';

import { LandingFooter } from '@/features/landing/components/landing-footer';
import { LandingHeader } from '@/features/landing/components/landing-header';
import type { LandingLocale } from '@/features/landing/locale';

interface LandingShellProps {
  children: ReactNode;
  locale: LandingLocale;
}

const ACCESS_TOKEN_COOKIE = 'ctxa_access_token';

export async function LandingShell({ children, locale }: LandingShellProps) {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value);

  return (
    <div className="landing-light relative min-h-dvh bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_66%)]"
        aria-hidden="true"
      />
      <LandingHeader isLoggedIn={isLoggedIn} locale={locale} />
      <main>{children}</main>
      <LandingFooter locale={locale} />
    </div>
  );
}
