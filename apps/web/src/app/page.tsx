import type { Metadata } from 'next';

import { LandingHome } from './landing-home';

export const metadata: Metadata = {
  title: 'Knowra - 从对话开始，把知识沉淀成资产',
  description:
    'Knowra 是 AI 原生知识工作空间，连接提问、导入、写作与整理，让结果沉淀为可协作、可复用、可分享的知识资产。',
};

export default function Page() {
  return <LandingHome locale="zh" />;
}
