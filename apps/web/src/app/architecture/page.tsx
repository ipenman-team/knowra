import type { Metadata } from 'next';

import { ArchitectureSection, LandingShell } from '@/features/landing/components';

export const metadata: Metadata = {
  title: 'Knowra - 架构闭环',
  description: '查看 Knowra 从输入到沉淀再到传播的完整知识工作闭环。',
};

export default function ArchitecturePage() {
  return (
    <LandingShell locale="zh">
      <ArchitectureSection locale="zh" />
    </LandingShell>
  );
}
