import { getLandingContent } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';

interface SecuritySectionProps {
  locale: LandingLocale;
}

export function SecuritySection({ locale }: SecuritySectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="security" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div>
        <p className="text-sm font-medium text-blue-600">{content.securitySection.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {content.securitySection.title}
        </h2>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {content.securityScenarios.map((scenario) => (
          <article key={scenario.title} className="rounded-2xl bg-slate-50/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold">{scenario.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{scenario.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
