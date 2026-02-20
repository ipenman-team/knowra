import type { Metadata } from 'next';

import { resolveLandingLocale } from '@/features/landing/locale';

import { LandingHome } from './landing-home';

export const metadata: Metadata = {
  title: 'Knowra - 智能化知识库',
  description:
    '面向用户场景的智能化知识库：语义化问答、知识协作闭环、可追溯版本治理。',
};

interface PageProps {
  searchParams: Promise<{ lang?: string | string[] }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale = resolveLandingLocale(params.lang);

  return <LandingHome locale={locale} />;
}
