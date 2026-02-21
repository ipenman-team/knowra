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
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-blue-700">{content.sceneShowcase.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {content.sceneShowcase.title}
        </h2>
      </div>

      <div className="mt-8 space-y-6">
        {content.sceneShowcase.items.map((item, index) => {
          const scene = getLandingSceneById(item.sceneId);

          return (
            <article
              key={item.title}
              className="landing-fade-in rounded-lg bg-white/75 p-4 shadow-[0_20px_46px_-34px_rgba(15,23,42,0.45)] md:p-6"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="grid gap-6 md:grid-cols-2 md:items-center">
                <div className={cn(index % 2 === 0 ? 'md:order-1' : 'md:order-2')}>
                  <LandingSceneImage
                    scene={scene}
                    className="w-full"
                    sizes="(min-width: 1280px) 760px, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
                <div
                  className={cn(
                    'flex flex-col justify-center md:px-2',
                    index % 2 === 0 ? 'md:order-2' : 'md:order-1',
                  )}
                >
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{item.title}</h3>
                  <p className="mt-4 text-base leading-8 text-slate-600">{item.description}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
