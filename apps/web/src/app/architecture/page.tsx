import type { Metadata } from 'next';

import { ArchitectureSection, LandingShell } from '@/features/landing/components';
import { resolveLandingLocale } from '@/features/landing/locale';

export const metadata: Metadata = {
  title: 'Knowra - Workflow Architecture',
  description: 'Scenario-driven workflow architecture for Knowra intelligent knowledge loops.',
};

interface ArchitecturePageProps {
  searchParams: Promise<{ lang?: string | string[] }>;
}

export default async function ArchitecturePage({ searchParams }: ArchitecturePageProps) {
  const params = await searchParams;
  const locale = resolveLandingLocale(params.lang);

  return (
    <LandingShell locale={locale}>
      <ArchitectureSection locale={locale} />
    </LandingShell>
  );
}
