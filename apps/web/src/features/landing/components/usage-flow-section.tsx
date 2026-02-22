import { getLandingContent, getLandingSceneById } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';
import { LandingSceneImage } from '@/features/landing/components/landing-scene-image';
import { cn } from '@/lib/utils';

interface UsageFlowSectionProps {
  locale: LandingLocale;
}

export function UsageFlowSection({ locale }: UsageFlowSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="entry-loop" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="text-center">
        <p className="text-sm font-medium text-blue-700">{content.entryLoop.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {content.entryLoop.title}
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600">{content.entryLoop.description}</p>
      </div>

      <div className="mt-8 space-y-6">
        {content.entryLoop.items.map((item, index) => {
          const scene = getLandingSceneById(item.sceneId);
          const imageFirst = index % 2 === 0;

          return (
            <article
              key={item.title}
              className={cn(
                'landing-fade-in grid gap-6 lg:items-start py-8',
                imageFirst ? 'lg:grid-cols-[13fr_1fr_6fr]' : 'lg:grid-cols-[6fr_1fr_13fr]',
              )}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className={cn(imageFirst ? 'lg:order-1' : 'lg:order-3')}>
                <div className="transition-transform duration-500 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.005]">
                  <LandingSceneImage
                    scene={scene}
                    className="w-full"
                    sizes="(min-width: 1280px) 65vw, (min-width: 1024px) 62vw, 100vw"
                  />
                </div>
              </div>

              <div className="hidden lg:block lg:order-2" aria-hidden="true" />

              <div className={cn('p-1 lg:p-0', imageFirst ? 'lg:order-3' : 'lg:order-1')}>
                <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>

                <ol className="mt-4 space-y-2">
                  {item.steps.map((step, stepIndex) => (
                    <li key={step} className="flex gap-2 text-sm text-slate-700">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                        {stepIndex + 1}
                      </span>
                      <span className="leading-6">{step}</span>
                    </li>
                  ))}
                </ol>

                <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
                  {item.outcome}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
