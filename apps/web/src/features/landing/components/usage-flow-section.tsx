import { getLandingContent } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';

interface UsageFlowSectionProps {
  locale: LandingLocale;
}

export function UsageFlowSection({ locale }: UsageFlowSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="usage-flow" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div>
        <p className="text-sm font-medium text-blue-600">{content.usageSection.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{content.usageSection.title}</h2>
      </div>

      <div className="mt-8 space-y-4">
        {content.usageSteps.map((item) => (
          <article key={item.step} className="rounded-2xl bg-slate-50/80 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-blue-600">{item.step}</div>
                <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
              <p className="text-sm font-medium text-foreground sm:max-w-sm sm:text-right">
                {item.outcome}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
