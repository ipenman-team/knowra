import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

function renderFeatureValue(value: PricingFeatureRow['free'], locale: LandingLocale) {
  if (value === 'optional') {
    return (
      <span className="font-medium text-amber-600">
        {locale === 'en' ? 'Optional' : '可选'}
      </span>
    );
  }

  return value ? <span className="text-emerald-600">✓</span> : <span className="text-muted-foreground">-</span>;
}

export function PricingSection({ locale }: PricingSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div>
        <p className="text-sm font-medium text-blue-600">{content.pricingSection.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{content.pricingSection.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{content.pricingSection.billingNote}</p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {content.pricingPlans.map((plan) => (
          <article
            key={plan.tier}
            className={cn('rounded-2xl bg-slate-50/80 p-6 shadow-sm', plan.highlighted && 'bg-blue-50')}
          >
            <div className="text-sm font-semibold text-muted-foreground">{plan.name}</div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{plan.priceLabel}</div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{plan.description}</p>

            <ul className="mt-4 space-y-2 text-sm">
              {plan.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
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

      <div className="mt-8 rounded-2xl bg-card p-4 shadow-sm sm:p-6">
        <h3 className="text-base font-semibold">{content.pricingSection.compareTitle}</h3>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[42%]">{content.pricingSection.columns.feature}</TableHead>
              <TableHead>{content.pricingSection.columns.free}</TableHead>
              <TableHead>{content.pricingSection.columns.pro}</TableHead>
              <TableHead>{content.pricingSection.columns.team}</TableHead>
              <TableHead>{content.pricingSection.columns.enterprise}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.pricingFeatureRows.map((row) => (
              <TableRow key={row.feature}>
                <TableCell className="font-medium">{row.feature}</TableCell>
                <TableCell>{renderFeatureValue(row.free, locale)}</TableCell>
                <TableCell>{renderFeatureValue(row.pro, locale)}</TableCell>
                <TableCell>{renderFeatureValue(row.team, locale)}</TableCell>
                <TableCell>{renderFeatureValue(row.enterprise, locale)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
