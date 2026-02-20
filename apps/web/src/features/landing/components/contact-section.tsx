import {
  getLandingContent,
  OFFICIAL_EMAIL,
  WECHAT_QR_IMAGE_URL,
} from '@/features/landing/content';
import type { LandingLocale } from '@/features/landing/locale';

interface ContactSectionProps {
  locale: LandingLocale;
}

export function ContactSection({ locale }: ContactSectionProps) {
  const content = getLandingContent(locale);

  return (
    <section id="contact" className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600">{content.contactSection.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{content.contactSection.title}</h2>
      </div>

      <div className="grid gap-6 rounded-3xl bg-slate-50/80 p-6 sm:p-8 lg:grid-cols-2">
        <div className="rounded-2xl bg-background p-6 shadow-sm">
          <h3 className="text-lg font-semibold">{content.contactSection.communityTitle}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{content.contactSection.communityDescription}</p>
          <div className="mt-4 w-fit rounded-xl bg-card p-3 shadow-sm">
            <img
              src={WECHAT_QR_IMAGE_URL}
              alt="Contexta community QR code"
              className="h-40 w-40 rounded-md object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-background p-6 shadow-sm">
          <h3 className="text-lg font-semibold">{content.contactSection.emailTitle}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{content.contactSection.emailDescription}</p>
          <a
            href={`mailto:${OFFICIAL_EMAIL}`}
            className="mt-4 inline-flex rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            {OFFICIAL_EMAIL}
          </a>
        </div>
      </div>
    </section>
  );
}
