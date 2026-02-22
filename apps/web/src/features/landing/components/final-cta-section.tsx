import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { DEFAULT_CTA_HREF, getLandingContent } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';

interface FinalCtaSectionProps {
  locale: LandingLocale;
}

export function FinalCtaSection({ locale }: FinalCtaSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-16 pt-10 lg:pb-24 lg:pt-14">
      <div className="bg-white p-8 text-center shadow-[0_20px_80px_-64px_rgba(15,23,42,0.75)] sm:p-10">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {content.finalCta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
          {content.finalCta.description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href={DEFAULT_CTA_HREF}>{content.finalCta.primaryCta}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/architecture">{content.finalCta.secondaryCta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
