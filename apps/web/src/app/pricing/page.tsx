import type { Metadata } from 'next';

import { LandingShell, PricingSection } from '@/features/landing/components';
import { resolveLandingLocale } from '@/features/landing/locale';

export const metadata: Metadata = {
  title: 'Contexta - Pricing',
  description: 'Annual pricing plans with capability comparison for personal and team workflows.',
};

interface PricingPageProps {
  searchParams: Promise<{ lang?: string | string[] }>;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;
  const locale = resolveLandingLocale(params.lang);

  return (
    <LandingShell locale={locale}>
      <PricingSection locale={locale} />
    </LandingShell>
  );
}
