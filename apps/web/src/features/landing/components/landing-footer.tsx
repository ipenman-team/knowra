import { ICP_FILING_NUMBER } from '@/lib/filing';
import type { LandingLocale } from '@/features/landing/locale';

interface LandingFooterProps {
  locale: LandingLocale;
}

export function LandingFooter({ locale }: LandingFooterProps) {
  const prefix = locale === 'en' ? 'All rights reserved' : '版权所有';

  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-6 py-7 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Contexta · {prefix} · {ICP_FILING_NUMBER}
      </div>
    </footer>
  );
}
