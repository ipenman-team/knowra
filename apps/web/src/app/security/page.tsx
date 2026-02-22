import type { Metadata } from 'next';

import { LandingShell, SecuritySection } from '@/features/landing/components';

export const metadata: Metadata = {
  title: 'Knowra - 安全管控',
  description: '覆盖用户数据、知识内容和模型密钥的基础防护与治理能力。',
};

export default function SecurityPage() {
  return (
    <LandingShell locale="zh">
      <SecuritySection locale="zh" />
    </LandingShell>
  );
}
