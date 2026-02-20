import { getLandingContent } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';

interface PainPointsSectionProps {
  locale: LandingLocale;
}

export function PainPointsSection({ locale }: PainPointsSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="pain-points" className="mx-auto max-w-7xl px-6 py-8 lg:py-12">
      <div>
        <p className="text-sm font-medium text-blue-600">{content.scenarioSection.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {content.scenarioSection.title}
        </h2>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        {content.scenarios.map((item) => (
          <article key={item.title} className="rounded-2xl bg-slate-50/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.summary}</p>

            <ul className="mt-4 space-y-2 text-sm text-foreground">
              {item.flow.map((flow) => (
                <li key={flow} className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                  <span>{flow}</span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-sm font-medium text-foreground">
              {item.result}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
