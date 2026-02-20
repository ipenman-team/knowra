import { getLandingContent } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';

interface PositioningSectionProps {
  locale: LandingLocale;
}

export function PositioningSection({ locale }: PositioningSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="positioning" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">{content.featureSection.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {content.featureSection.title}
          </h2>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {content.featureHighlights.map((item) => (
          <article key={item.title} className="rounded-2xl bg-slate-50/80 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              {item.badge ? (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
