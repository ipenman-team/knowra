import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { DEFAULT_CTA_HREF, getLandingContent } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';
import { withLandingLocale } from '@/features/landing/locale';

interface HeroSectionProps {
  locale: LandingLocale;
}

export function HeroSection({ locale }: HeroSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="hero" className="mx-auto max-w-7xl px-6 pb-14 pt-16 lg:pb-20 lg:pt-24">
      <div className="rounded-3xl bg-gradient-to-br from-blue-50 via-background to-cyan-50 p-8 shadow-sm lg:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{content.hero.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {content.hero.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={DEFAULT_CTA_HREF}>{content.hero.primaryCta}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={withLandingLocale('/architecture', locale)}>{content.hero.secondaryCta}</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {content.hero.tags.map((tag) => (
              <div
                key={tag}
                className="rounded-2xl bg-background/85 px-4 py-4 text-sm font-medium text-foreground shadow-sm"
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
