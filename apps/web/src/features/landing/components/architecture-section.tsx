import { getLandingContent } from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';

interface ArchitectureSectionProps {
  locale: LandingLocale;
}

export function ArchitectureSection({ locale }: ArchitectureSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="architecture" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-blue-700">{content.architecture.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {content.architecture.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{content.architecture.description}</p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">{content.architecture.loopTitle}</h2>
          {content.architecture.loopSteps.map((item) => (
            <article key={item.stage} className="bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.45)]">
              <div className="flex items-center gap-3 text-sm font-semibold text-blue-700">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-50 text-xs">
                  {item.stage}
                </span>
                <span>{item.title}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              <p className="mt-3 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
                能力承接：{item.capability}
              </p>
            </article>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.45)]">
            <h2 className="text-base font-semibold text-slate-900">{content.architecture.mappingTitle}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              {content.architecture.mappingBullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-50 p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.4)]">
            <h3 className="text-sm font-semibold text-slate-900">闭环结果</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              输入、理解、沉淀和传播在同一系统内连续完成，减少知识工作在工具间跳转造成的损耗。
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
