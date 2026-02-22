import { getLandingContent } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';

interface PainPointsSectionProps {
  locale: LandingLocale;
}

export function PainPointsSection({ locale }: PainPointsSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="pain-points" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="text-center">
        <p className="text-sm font-medium text-blue-700">{content.homeNarrative.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {content.homeNarrative.title}
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600">{content.homeNarrative.intro}</p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {content.homeNarrative.painGroups.map((item, index) => (
          <article
            key={item.title}
            className="landing-fade-in rounded-lg bg-white p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.45)] [animation-delay:140ms]"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>

            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
              {item.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
