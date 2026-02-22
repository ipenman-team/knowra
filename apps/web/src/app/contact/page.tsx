import type { Metadata } from 'next';

import { ContactSection, LandingShell } from '@/features/landing/components';

export const metadata: Metadata = {
  title: 'Knowra - 联系官方',
  description: '通过社群或邮箱联系 Knowra，快速获得支持与合作响应。',
};

export default function ContactPage() {
  return (
    <LandingShell locale="zh">
      <ContactSection locale="zh" />
    </LandingShell>
  );
}
