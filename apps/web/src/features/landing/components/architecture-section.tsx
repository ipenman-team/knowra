import { getLandingContent, type UserScenario } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';

interface ScenarioFlowCardProps {
  scenario: UserScenario;
  order: number;
  scenarioLabel: string;
  stepLabel: string;
  resultLabel: string;
}

interface ScenarioFlowDiagramProps {
  steps: readonly string[];
  stepLabel: string;
}

function ScenarioFlowDiagram({ steps, stepLabel }: ScenarioFlowDiagramProps) {
  return (
    <>
      <div className="hidden items-stretch gap-2 md:flex">
        {steps.map((step, index) => (
          <div key={step} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-h-24 w-full flex-col rounded-xl bg-background p-4 shadow-sm">
              <div className="text-xs font-semibold text-blue-600">
                {stepLabel} {index + 1}
              </div>
              <p className="mt-2 text-sm leading-6 text-foreground">{step}</p>
            </div>
            {index < steps.length - 1 ? (
              <div className="flex items-center" aria-hidden="true">
                <span className="h-px w-5 bg-blue-300" />
                <span className="ml-1 text-xs font-semibold text-blue-500">{'>'}</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-2 md:hidden">
        {steps.map((step, index) => (
          <div key={step}>
            <div className="rounded-xl bg-background p-4 shadow-sm">
              <div className="text-xs font-semibold text-blue-600">
                {stepLabel} {index + 1}
              </div>
              <p className="mt-2 text-sm leading-6 text-foreground">{step}</p>
            </div>
            {index < steps.length - 1 ? (
              <div className="mx-auto my-1 flex w-6 flex-col items-center" aria-hidden="true">
                <span className="h-3 w-px bg-blue-300" />
                <span className="text-xs font-semibold text-blue-500">v</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}

function ScenarioFlowCard({
  scenario,
  order,
  scenarioLabel,
  stepLabel,
  resultLabel,
}: ScenarioFlowCardProps) {
  return (
    <article className="rounded-2xl bg-slate-50/80 p-6 shadow-sm">
      <div className="text-sm font-semibold text-blue-600">
        {scenarioLabel} {order}
      </div>
      <h3 className="mt-1 text-lg font-semibold">{scenario.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{scenario.summary}</p>

      <div className="mt-4">
        <ScenarioFlowDiagram steps={scenario.flow} stepLabel={stepLabel} />
      </div>

      <p className="mt-4 text-sm font-medium text-foreground">
        {resultLabel}: {scenario.result}
      </p>
    </article>
  );
}

interface ArchitectureSectionProps {
  locale: LandingLocale;
}

export function ArchitectureSection({ locale }: ArchitectureSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="architecture" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div>
        <p className="text-sm font-medium text-blue-600">{content.architectureSection.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {content.architectureSection.title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {content.architectureSection.description}
        </p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          {content.scenarios.map((scenario, index) => (
            <ScenarioFlowCard
              key={scenario.title}
              scenario={scenario}
              order={index + 1}
              scenarioLabel={locale === 'en' ? 'Scenario' : '场景'}
              stepLabel={content.architectureSection.stepLabel}
              resultLabel={content.architectureSection.resultLabel}
            />
          ))}
        </div>

        <div className="space-y-5">
          <aside className="rounded-2xl bg-slate-50/80 p-6 shadow-sm">
            <h3 className="text-base font-semibold">{content.architectureSection.supportTitle}</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {content.architectureBullets.map((item) => (
                <li key={item} className="leading-6">
                  {item}
                </li>
              ))}
            </ul>
          </aside>

          <aside className="rounded-2xl bg-slate-50/80 p-6 shadow-sm">
            <h3 className="text-base font-semibold">{content.architectureSection.featureCoverageTitle}</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {content.featureHighlights.map((item) => (
                <li key={item.title} className="flex items-start justify-between gap-3 leading-6">
                  <span>{item.title}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {item.badge}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
