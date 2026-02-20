import type { Metadata } from 'next';

import { LandingShell, SecuritySection } from '@/features/landing/components';
import { resolveLandingLocale } from '@/features/landing/locale';

export const metadata: Metadata = {
  title: 'Knowra - Security',
  description: 'Data protection, permission governance, and model key security for knowledge workflows.',
};

interface SecurityPageProps {
  searchParams: Promise<{ lang?: string | string[] }>;
}

export default async function SecurityPage({ searchParams }: SecurityPageProps) {
  const params = await searchParams;
  const locale = resolveLandingLocale(params.lang);

  return (
    <LandingShell locale={locale}>
      <SecuritySection locale={locale} />
    </LandingShell>
  );
}
