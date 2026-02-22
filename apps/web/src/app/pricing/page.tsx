import type { Metadata } from 'next';

import { LandingShell, PricingSection } from '@/features/landing/components';

export const metadata: Metadata = {
  title: 'Knowra - 产品定价',
  description: '个人免费，付费套餐按年订阅，支持按席位扩展。',
};

export default function PricingPage() {
  return (
    <LandingShell locale="zh">
      <PricingSection locale="zh" />
    </LandingShell>
  );
}
