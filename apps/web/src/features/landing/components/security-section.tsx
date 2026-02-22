import { getLandingContent } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';

interface SecuritySectionProps {
  locale: LandingLocale;
}

export function SecuritySection({ locale }: SecuritySectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="security" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-blue-700">{content.security.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {content.security.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{content.security.description}</p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {content.security.cards.map((card) => (
          <article key={card.title} className="bg-white p-6 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.45)]">
            <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 bg-slate-50 p-6 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.4)]">
        <h2 className="text-base font-semibold text-slate-900">{content.security.governanceTitle}</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          {content.security.governanceBullets.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
