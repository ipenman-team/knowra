import {
  FinalCtaSection,
  HeroSection,
  LandingShell,
  PainPointsSection,
  PositioningSection,
  SceneShowcaseSection,
  UsageFlowSection,
} from '@/features/landing/components';
import type { LandingLocale } from '@/features/landing/locale';

interface LandingHomeProps {
  locale: LandingLocale;
}

export function LandingHome({ locale }: LandingHomeProps) {
  return (
    <LandingShell locale={locale}>
      <HeroSection locale={locale} />
      <PainPointsSection locale={locale} />
      <UsageFlowSection locale={locale} />
      <PositioningSection locale={locale} />
      <SceneShowcaseSection locale={locale} />
      <FinalCtaSection locale={locale} />
    </LandingShell>
  );
}
