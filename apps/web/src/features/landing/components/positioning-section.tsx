import { getLandingContent } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';

interface PositioningSectionProps {
  locale: LandingLocale;
}

export function PositioningSection({ locale }: PositioningSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="core-capabilities" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="text-center">
        <p className="text-sm font-medium text-blue-700">{content.coreCapabilities.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {content.coreCapabilities.title}
        </h2>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {content.coreCapabilities.items.map((item, index) => (
          <article
            key={item.title}
            className="landing-fade-in rounded-lg bg-white p-6 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.45)]"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              {item.badge ? (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
