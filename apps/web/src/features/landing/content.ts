import type { LandingLocale } from '@/features/landing/locale';

export type LandingPricingTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface PricingPlan {
  tier: LandingPricingTier;
  name: string;
  priceLabel: string;
  description: string;
  ctaLabel: string;
  benefits: string[];
  highlighted?: boolean;
}

export interface PricingFeatureRow {
  feature: string;
  free: boolean | 'optional';
  pro: boolean | 'optional';
  team: boolean | 'optional';
  enterprise: boolean | 'optional';
}

export interface SecurityScenario {
  title: string;
  description: string;
}

export interface FeatureHighlight {
  title: string;
  description: string;
  badge?: string;
}

export interface LandingNavItem {
  label: string;
  href: string;
}

export interface UserScenario {
  title: string;
  summary: string;
  flow: string[];
  result: string;
}

export interface UsageStep {
  step: string;
  title: string;
  description: string;
  outcome: string;
}

export interface LandingContent {
  navItems: ReadonlyArray<LandingNavItem>;
  header: {
    loginCta: string;
    startCta: string;
    workbenchCta: string;
    localeZh: string;
    localeEn: string;
  };
  hero: {
    title: string;
    description: string;
    tags: readonly string[];
    primaryCta: string;
    secondaryCta: string;
  };
  scenarioSection: {
    eyebrow: string;
    title: string;
  };
  scenarios: ReadonlyArray<UserScenario>;
  featureSection: {
    eyebrow: string;
    title: string;
  };
  featureHighlights: ReadonlyArray<FeatureHighlight>;
  usageSection: {
    eyebrow: string;
    title: string;
  };
  usageSteps: ReadonlyArray<UsageStep>;
  architectureSection: {
    eyebrow: string;
    title: string;
    description: string;
    supportTitle: string;
    featureCoverageTitle: string;
    stepLabel: string;
    resultLabel: string;
  };
  architectureBullets: readonly string[];
  securitySection: {
    eyebrow: string;
    title: string;
  };
  securityScenarios: ReadonlyArray<SecurityScenario>;
  pricingSection: {
    eyebrow: string;
    title: string;
    billingNote: string;
    compareTitle: string;
    columns: {
      feature: string;
      free: string;
      pro: string;
      team: string;
      enterprise: string;
    };
  };
  pricingPlans: ReadonlyArray<PricingPlan>;
  pricingFeatureRows: ReadonlyArray<PricingFeatureRow>;
  contactSection: {
    eyebrow: string;
    title: string;
    communityTitle: string;
    communityDescription: string;
    emailTitle: string;
    emailDescription: string;
  };
}

export const DEFAULT_CTA_HREF = '/login';
export const WECHAT_QR_IMAGE_URL =
  'https://placehold.co/360x360/png?text=Contexta+WeChat+QR+Placeholder';
export const OFFICIAL_EMAIL = 'support@contexta.ai';

const ZH_CONTENT: LandingContent = {
  navItems: [
    { label: '产品定位', href: '/' },
    { label: '架构', href: '/architecture' },
    { label: '安全', href: '/security' },
    { label: '定价', href: '/pricing' },
    { label: '联系官方', href: '/contact' },
  ],
  header: {
    loginCta: '登录',
    startCta: '开始使用',
    workbenchCta: '进入工作台',
    localeZh: '中文',
    localeEn: 'EN',
  },
  hero: {
    title: '智能化知识库',
    description:
      '上传任何内容进行提问，答案会直接以文档和待办事项的形式呈现——无需排序、同步或重复录入。',
    tags: ['智能化知识库', '语义化检索问答', '知识协作闭环'],
    primaryCta: '开始使用',
    secondaryCta: '查看使用闭环',
  },
  scenarioSection: {
    eyebrow: '核心场景',
    title: '两个高频使用场景，覆盖从提问到落地',
  },
  scenarios: [
    {
      title: '上传资料，立刻开始追问',
      summary:
        '把需求文档、会议纪要直接上传，AI 自动提取重点，支持连续追问，回答结果可一键插入现有文档，不用再手动整理。',
      flow: [
        '上传附件（需求文档、会议纪要、方案说明）',
        'AI 自动提取结构与关键点',
        '针对细节持续追问、澄清',
        '结果一键插入现有页面或生成新页面',
      ],
      result: '需求分析更快落地，不再反复整理与二次录入',
    },
    {
      title: '沉淀知识，随时按需检索',
      summary:
        '团队在空间里持续写作和沉淀，AI 基于内容语义回答问题，可自由切换互联网、当前空间或指定空间作为参考范围。',
      flow: [
        '在个人或协作空间持续写作、沉淀知识',
        '提问时选择参考范围（互联网 / 当前空间 / 指定空间）',
        'AI 给出贴合上下文的答案',
        '将答案继续写入页面，形成新的知识沉淀',
      ],
      result: '回答更贴近业务语境，团队知识被真正复用',
    },
  ],
  featureSection: {
    eyebrow: '核心亮点',
    title: '围绕智能化知识库构建的专业能力',
  },
  featureHighlights: [
    {
      title: '空间导入与导出',
      description: '支持历史资料批量导入与空间内容导出归档，降低迁移成本',
    },
    {
      title: '个人空间与多人协作空间',
      description: '既满足个人沉淀，也支持团队协作编辑、点赞与评论互动',
    },
    {
      title: '页面与空间共享',
      description: '支持页面级与空间级共享，便于跨团队传播知识',
    },
    {
      title: '自定义站点发布',
      description: '可将空间内容发布为站点，满足对外展示与知识运营需求',
      badge: 'Pro',
    },
    {
      title: '历史版本与回滚',
      description: '页面历史版本可追溯，支持回滚，减少误改带来的业务风险',
    },
    {
      title: 'AI 结果到文档的直接转化',
      description: '问答结果可直接插入页面或转为结构化内容，打通从思考到交付的链路',
    },
  ],
  usageSection: {
    eyebrow: '如何完成需求',
    title: '用一条可执行流程，把问题变成交付结果',
  },
  usageSteps: [
    {
      step: '01',
      title: '创建空间并导入资料',
      description: '先建立需求空间，导入附件、文档与历史页面，形成统一知识源',
      outcome: '信息集中，避免跨工具反复查找',
    },
    {
      step: '02',
      title: '选择问答范围并提问',
      description: '根据任务类型选择互联网、当前空间或指定空间，再发起问题',
      outcome: '答案更贴合当前业务场景',
    },
    {
      step: '03',
      title: '把答案沉淀为页面与协作项',
      description: '将有效回答插入页面，结合评论、点赞和协作空间推动执行',
      outcome: '从知识获取直接进入团队行动',
    },
    {
      step: '04',
      title: '共享发布并持续迭代',
      description: '通过页面/空间共享或站点发布传播成果，按版本回滚持续优化',
      outcome: '形成可演进、可复用的知识资产闭环',
    },
  ],
  architectureSection: {
    eyebrow: '用户视角架构',
    title: '围绕真实使用场景设计的智能化知识库闭环',
    description:
      'Contexta 的架构并非单纯技术分层，而是围绕用户从上传资料到回答落地的全过程设计。下面展示两个核心场景如何在同一系统中完成闭环。',
    supportTitle: '闭环支撑能力',
    featureCoverageTitle: '关键功能覆盖',
    stepLabel: '步骤',
    resultLabel: '闭环结果',
  },
  architectureBullets: [
    '知识输入层：支持附件上传、空间导入与历史内容聚合，统一形成可检索知识源',
    '检索决策层：问答可切换互联网、当前空间或指定空间，保证答案范围可控',
    '内容沉淀层：AI 回答可直接插入页面或转化文档，减少重复整理',
    '协作交互层：个人空间与多人空间共存，支持评论、点赞与协作反馈',
    '发布扩散层：页面/空间共享与站点发布（Pro）支撑知识对内对外传播',
    '治理保障层：历史版本追踪与回滚能力，保障内容演进安全',
  ],
  securitySection: {
    eyebrow: '安全与管控',
    title: '资产安全、数据安全与权限治理',
  },
  securityScenarios: [
    {
      title: '用户数据保护',
      description: '默认启用传输链路安全、租户隔离和会话控制，保障账号与数据边界',
    },
    {
      title: '知识内容保护（权限）',
      description: '支持空间与页面权限配置、共享控制与可见性边界管理，降低误共享风险',
    },
    {
      title: '模型密钥安全',
      description: 'API Key 加密存储与脱敏展示，配合最小权限策略，避免密钥泄露',
    },
  ],
  pricingSection: {
    eyebrow: '产品定价',
    title: '个人免费，付费套餐按年订阅',
    billingNote: '付费套餐按年订阅，支持按席位扩展',
    compareTitle: '功能对比',
    columns: {
      feature: '功能',
      free: 'Free',
      pro: 'Pro',
      team: 'Team',
      enterprise: 'Enterprise',
    },
  },
  pricingPlans: [
    {
      tier: 'free',
      name: 'Free',
      priceLabel: '¥0',
      description: '个人基础使用，快速开始知识管理与基础问答',
      ctaLabel: '免费开始',
      benefits: ['个人空间', '基础 AI 问答', '文档导入与检索'],
    },
    {
      tier: 'pro',
      name: 'Pro',
      priceLabel: '¥99/年',
      description: '面向个人创作者，解锁更高阶的知识使用体验',
      ctaLabel: '升级到 Pro',
      benefits: ['空间共享高级设置', '更高问答容量', '优先体验新能力'],
      highlighted: true,
    },
    {
      tier: 'team',
      name: 'Team',
      priceLabel: '¥99/人/年',
      description: '面向团队协作，提供成员协同和权限治理能力',
      ctaLabel: '开始团队版',
      benefits: ['成员邀请与协作', '角色与权限治理', '团队知识空间管理'],
    },
    {
      tier: 'enterprise',
      name: 'Enterprise',
      priceLabel: '联系销售',
      description: '企业级合规与定制支持，满足复杂组织落地要求',
      ctaLabel: '联系销售',
      benefits: ['私有化部署支持', '高级安全与审计策略', '专属技术支持'],
    },
  ],
  pricingFeatureRows: [
    {
      feature: '个人文档管理与基础 AI 问答',
      free: true,
      pro: true,
      team: true,
      enterprise: true,
    },
    {
      feature: '空间共享高级设置',
      free: false,
      pro: true,
      team: true,
      enterprise: true,
    },
    {
      feature: '团队协作成员管理',
      free: false,
      pro: false,
      team: true,
      enterprise: true,
    },
    {
      feature: '角色与权限治理',
      free: false,
      pro: false,
      team: true,
      enterprise: true,
    },
    {
      feature: '私有化/专属支持',
      free: false,
      pro: false,
      team: 'optional',
      enterprise: true,
    },
  ],
  contactSection: {
    eyebrow: '联系官方',
    title: '保持沟通，快速获得支持',
    communityTitle: '加入官方社群',
    communityDescription: '扫码加入微信社群，获取产品更新与使用交流',
    emailTitle: '邮箱联系',
    emailDescription: '企业合作、功能咨询或反馈建议，请通过官方邮箱联系',
  },
};

const EN_CONTENT: LandingContent = {
  navItems: [
    { label: 'Product', href: '/' },
    { label: 'Workflow', href: '/architecture' },
    { label: 'Security', href: '/security' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: '/contact' },
  ],
  header: {
    loginCta: 'Log in',
    startCta: 'Get Started',
    workbenchCta: 'Open Workbench',
    localeZh: '中文',
    localeEn: 'EN',
  },
  hero: {
    title: 'An Intelligent Knowledge Base That Closes Work Faster',
    description:
      'Upload anything and start asking right away. Answers land directly as docs and action items—no sorting, syncing, or double entry required.',
    tags: ['Intelligent Knowledge Base', 'Semantic Retrieval Q&A', 'Collaboration Loop'],
    primaryCta: 'Get Started',
    secondaryCta: 'View Workflow',
  },
  scenarioSection: {
    eyebrow: 'Core Scenarios',
    title: 'Two practical scenarios from question to execution',
  },
  scenarios: [
    {
      title: 'Upload files, start asking right away',
      summary:
        'Drop in your requirement docs or meeting notes. AI extracts key points and supports follow-up questions. Answers insert directly into existing pages—no retyping needed.',
      flow: [
        'Upload files (requirements, notes, design docs)',
        'AI automatically extracts structure and key points',
        'Ask follow-up questions to clarify details',
        'Insert results into existing pages or generate new ones',
      ],
      result: 'Faster analysis. No more manual rewrite or double entry.',
    },
    {
      title: 'Build your knowledge base, retrieve anytime',
      summary:
        'Keep writing in your spaces. AI answers questions based on your content semantically—freely switch between internet, current space, or selected spaces.',
      flow: [
        'Keep writing and building knowledge in personal or team spaces',
        'Choose a reference scope when asking (internet / current space / selected spaces)',
        'AI returns context-aware answers',
        'Write useful answers back into pages to keep knowledge growing',
      ],
      result: 'Context-aware answers your team can actually reuse.',
    },
  ],
  featureSection: {
    eyebrow: 'Capabilities',
    title: 'Professional features for an intelligent knowledge system',
  },
  featureHighlights: [
    {
      title: 'Space Import and Export',
      description: 'Import legacy materials in bulk and export space content for archiving.',
    },
    {
      title: 'Personal and Collaborative Spaces',
      description: 'Support both personal knowledge work and team collaboration with likes and comments.',
    },
    {
      title: 'Page and Space Sharing',
      description: 'Share at page-level or space-level for cross-team knowledge distribution.',
    },
    {
      title: 'Custom Site Publishing',
      description: 'Publish space content as a site for external knowledge distribution.',
      badge: 'Pro',
    },
    {
      title: 'Version History and Rollback',
      description: 'Track page history and roll back safely when changes go wrong.',
    },
    {
      title: 'AI Response to Doc Conversion',
      description: 'Turn responses into structured documentation without extra copy work.',
    },
  ],
  usageSection: {
    eyebrow: 'How It Works',
    title: 'Use one executable flow to deliver outcomes',
  },
  usageSteps: [
    {
      step: '01',
      title: 'Create a space and import materials',
      description: 'Set up a working space and bring in files, docs, and existing pages.',
      outcome: 'A unified source of knowledge for the task.',
    },
    {
      step: '02',
      title: 'Ask with scope control',
      description: 'Choose internet, current space, or selected spaces before asking.',
      outcome: 'Answers remain aligned to the task context.',
    },
    {
      step: '03',
      title: 'Convert answers into collaborative assets',
      description: 'Insert responses into pages and move forward with comments and likes.',
      outcome: 'Knowledge directly drives coordinated action.',
    },
    {
      step: '04',
      title: 'Share, publish, and iterate',
      description: 'Share pages/spaces or publish sites, then improve through versioned updates.',
      outcome: 'A reusable and evolving knowledge loop.',
    },
  ],
  architectureSection: {
    eyebrow: 'User-centric Workflow Architecture',
    title: 'A scenario-driven architecture for intelligent knowledge loops',
    description:
      'This is not just a technical layering diagram. Contexta is designed around the full user path from material input to answer execution and iterative improvement.',
    supportTitle: 'Capabilities Behind the Loop',
    featureCoverageTitle: 'Feature Coverage',
    stepLabel: 'Step',
    resultLabel: 'Loop Outcome',
  },
  architectureBullets: [
    'Input Layer: file uploads, space imports, and historical content aggregation.',
    'Scope & Retrieval Layer: semantic retrieval with internet/space/selected-space control.',
    'Conversion Layer: convert AI responses directly into pages or structured docs.',
    'Collaboration Layer: personal and team spaces with comments, likes, and feedback.',
    'Distribution Layer: page/space sharing and Pro site publishing.',
    'Governance Layer: version history and rollback for safe knowledge evolution.',
  ],
  securitySection: {
    eyebrow: 'Security and Governance',
    title: 'Data protection, content control, and key safety',
  },
  securityScenarios: [
    {
      title: 'User Data Protection',
      description: 'Secure transport, tenant isolation, and session controls protect account boundaries.',
    },
    {
      title: 'Knowledge Permission Control',
      description: 'Space/page visibility and sharing controls reduce accidental exposure risks.',
    },
    {
      title: 'Model Key Security',
      description: 'Encrypted storage and masked display protect API keys under least-privilege practices.',
    },
  ],
  pricingSection: {
    eyebrow: 'Pricing',
    title: 'Free for individuals, annual plans for advanced usage',
    billingNote: 'Paid tiers are billed annually and can scale by seats.',
    compareTitle: 'Feature Comparison',
    columns: {
      feature: 'Feature',
      free: 'Free',
      pro: 'Pro',
      team: 'Team',
      enterprise: 'Enterprise',
    },
  },
  pricingPlans: [
    {
      tier: 'free',
      name: 'Free',
      priceLabel: '¥0',
      description: 'For individual baseline knowledge work and AI Q&A.',
      ctaLabel: 'Start Free',
      benefits: ['Personal space', 'Basic AI Q&A', 'File import and retrieval'],
    },
    {
      tier: 'pro',
      name: 'Pro',
      priceLabel: '¥468/year',
      description: 'For power users who need advanced knowledge workflows.',
      ctaLabel: 'Upgrade to Pro',
      benefits: ['Advanced sharing settings', 'Higher Q&A capacity', 'Priority feature access'],
      highlighted: true,
    },
    {
      tier: 'team',
      name: 'Team',
      priceLabel: '¥2,388/seat/year',
      description: 'For teams requiring collaboration and governance controls.',
      ctaLabel: 'Start Team',
      benefits: ['Member collaboration', 'Role and permission controls', 'Team space management'],
    },
    {
      tier: 'enterprise',
      name: 'Enterprise',
      priceLabel: 'Contact sales',
      description: 'For enterprise-grade compliance and customization requirements.',
      ctaLabel: 'Contact Sales',
      benefits: ['Private deployment support', 'Advanced audit and security options', 'Dedicated support'],
    },
  ],
  pricingFeatureRows: [
    {
      feature: 'Personal docs and basic AI Q&A',
      free: true,
      pro: true,
      team: true,
      enterprise: true,
    },
    {
      feature: 'Advanced space sharing settings',
      free: false,
      pro: true,
      team: true,
      enterprise: true,
    },
    {
      feature: 'Team member collaboration management',
      free: false,
      pro: false,
      team: true,
      enterprise: true,
    },
    {
      feature: 'Roles and permission governance',
      free: false,
      pro: false,
      team: true,
      enterprise: true,
    },
    {
      feature: 'Private deployment / dedicated support',
      free: false,
      pro: false,
      team: 'optional',
      enterprise: true,
    },
  ],
  contactSection: {
    eyebrow: 'Contact',
    title: 'Stay connected and get support quickly',
    communityTitle: 'Join Community',
    communityDescription: 'Scan to join the WeChat community for updates and best practices.',
    emailTitle: 'Email Us',
    emailDescription: 'For business cooperation, questions, or feedback, contact us by email.',
  },
};

export function getLandingContent(locale: LandingLocale): LandingContent {
  return locale === 'en' ? EN_CONTENT : ZH_CONTENT;
}
