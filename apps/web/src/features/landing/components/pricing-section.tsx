import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DEFAULT_CTA_HREF,
  getLandingContent,
  type PricingFeatureRow,
} from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';
import { cn } from '@/lib/utils';

interface PricingSectionProps {
  locale: LandingLocale;
}

function renderFeatureValue(value: PricingFeatureRow['free']) {
  if (value === 'optional') {
    return <span className="font-medium text-amber-600">可选</span>;
  }
  return value ? <span className="text-emerald-600">✓</span> : <span className="text-slate-400">-</span>;
}

export function PricingSection({ locale }: PricingSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div>
        <p className="text-sm font-medium text-blue-700">{content.pricing.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {content.pricing.title}
        </h1>
        <p className="mt-3 text-sm text-slate-600">{content.pricing.billingNote}</p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {content.pricing.plans.map((plan) => (
          <article
            key={plan.tier}
            className={cn(
              'bg-white p-6 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.45)]',
              plan.highlighted && 'bg-blue-50/40',
            )}
          >
            <div className="text-sm font-semibold text-slate-500">{plan.name}</div>
            <div className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{plan.priceLabel}</div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{plan.description}</p>

            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {plan.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <Button asChild className="mt-6 w-full" variant={plan.highlighted ? 'default' : 'outline'}>
              <Link href={DEFAULT_CTA_HREF}>{plan.ctaLabel}</Link>
            </Button>
          </article>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto bg-white p-4 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.45)] sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">{content.pricing.compareTitle}</h2>

        <table className="mt-4 w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-3 py-3 font-medium">{content.pricing.columns.feature}</th>
              <th className="px-3 py-3 font-medium">{content.pricing.columns.free}</th>
              <th className="px-3 py-3 font-medium">{content.pricing.columns.pro}</th>
              <th className="px-3 py-3 font-medium">{content.pricing.columns.team}</th>
              <th className="px-3 py-3 font-medium">{content.pricing.columns.enterprise}</th>
            </tr>
          </thead>
          <tbody>
            {content.pricing.featureRows.map((row) => (
              <tr key={row.feature} className="border-b border-slate-100 last:border-none">
                <td className="px-3 py-3 font-medium text-slate-900">{row.feature}</td>
                <td className="px-3 py-3">{renderFeatureValue(row.free)}</td>
                <td className="px-3 py-3">{renderFeatureValue(row.pro)}</td>
                <td className="px-3 py-3">{renderFeatureValue(row.team)}</td>
                <td className="px-3 py-3">{renderFeatureValue(row.enterprise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
