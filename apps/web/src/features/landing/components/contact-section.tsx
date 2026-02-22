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
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-blue-700">{content.contact.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {content.contact.title}
        </h1>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {content.contact.cards.map((card) => (
          <article key={card.title} className="bg-white p-6 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.45)]">
            <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
            <a
              href={card.href}
              className="mt-4 inline-flex border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
            >
              {card.cta}
            </a>
          </article>
        ))}
      </div>

      <div id="community-qr" className="mt-6 bg-slate-50 p-6 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.4)]">
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="w-fit bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={WECHAT_QR_IMAGE_URL}
              alt="Knowra community QR code"
              className="h-36 w-36 object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">扫码加入官方社群</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              需要企业合作或私有化咨询，也可以直接邮件联系 <a href={`mailto:${OFFICIAL_EMAIL}`} className="font-medium text-slate-900">{OFFICIAL_EMAIL}</a>。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
