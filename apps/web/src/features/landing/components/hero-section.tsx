import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DEFAULT_CTA_HREF,
  getLandingContent,
  getLandingSceneById,
} from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';
import { LandingSceneCarousel } from '@/features/landing/components/landing-scene-carousel';

interface HeroSectionProps {
  locale: LandingLocale;
}

export function HeroSection({ locale }: HeroSectionProps) {
  const content = getLandingContent(locale);
  const carouselScenes = content.hero.carouselSceneIds.map((id) => getLandingSceneById(id));

  return (
    <section
      id="product-focus"
      className="mx-auto max-w-7xl px-6 pb-14 pt-12 sm:pt-16 lg:pb-20 lg:pt-20"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div className="landing-fade-in space-y-6">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {content.hero.title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {content.hero.description}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={DEFAULT_CTA_HREF}>{content.hero.primaryCta}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/architecture">{content.hero.secondaryCta}</Link>
            </Button>
          </div>

          <p className="text-sm text-slate-500">{content.hero.supportText}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            {content.hero.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg bg-white/85 p-4 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.45)]"
              >
                <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-fade-in [animation-delay:120ms]">
          <div className="landing-float rounded-lg bg-white shadow-[0_24px_80px_-52px_rgba(15,23,42,0.65)]">
            <LandingSceneCarousel scenes={carouselScenes} />
          </div>
        </div>
      </div>
    </section>
  );
}
