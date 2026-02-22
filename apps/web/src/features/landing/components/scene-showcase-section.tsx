import { getLandingContent, getLandingSceneById } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';
import { LandingSceneImage } from '@/features/landing/components/landing-scene-image';
import { cn } from '@/lib/utils';

interface SceneShowcaseSectionProps {
  locale: LandingLocale;
}

export function SceneShowcaseSection({ locale }: SceneShowcaseSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="scene-showcase" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="text-center">
        <p className="text-sm font-medium text-blue-700">{content.sceneShowcase.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {content.sceneShowcase.title}
        </h2>
      </div>

      <div className="mt-8 space-y-6">
        {content.sceneShowcase.items.map((item, index) => {
          const scene = getLandingSceneById(item.sceneId);
          const imageFirst = index % 2 === 0;

          return (
            <article
              key={item.title}
              className={cn(
                'landing-fade-in grid gap-6 lg:items-center py-8',
                imageFirst ? 'lg:grid-cols-[67fr_3fr_30fr]' : 'lg:grid-cols-[30fr_3fr_67fr]',
              )}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className={cn(imageFirst ? 'lg:order-1' : 'lg:order-3')}>
                <div className="transition-transform duration-500 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.005]">
                  <LandingSceneImage
                    scene={scene}
                    className="w-full"
                    sizes="(min-width: 1280px) 67vw, (min-width: 1024px) 64vw, 100vw"
                  />
                </div>
              </div>

              <div className="hidden lg:block lg:order-2" aria-hidden="true" />

              <div className={cn('flex flex-col justify-center', imageFirst ? 'lg:order-3' : 'lg:order-1')}>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{item.title}</h3>
                <p className="mt-4 text-base leading-8 text-slate-600">{item.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
