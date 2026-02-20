import type { Metadata } from 'next';

import { ContactSection, LandingShell } from '@/features/landing/components';
import { resolveLandingLocale } from '@/features/landing/locale';

export const metadata: Metadata = {
  title: 'Contexta - Contact',
  description: 'Contact Contexta via community channel or official support email.',
};

interface ContactPageProps {
  searchParams: Promise<{ lang?: string | string[] }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const locale = resolveLandingLocale(params.lang);

  return (
    <LandingShell locale={locale}>
      <ContactSection locale={locale} />
    </LandingShell>
  );
}
