import type { LandingLocale } from '@/features/landing/locale';

export type LandingPricingTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface LandingSceneAsset {
  id:
    | 'ai-question-internet'
    | 'ai-insert-panel'
    | 'editor-ai-toolbar'
    | 'editor-ai-result'
    | 'ai-search-all-knowledge';
  title: string;
  caption: string;
  src: string;
  fallbackSrc: string;
  alt: string;
}

export interface MarketingNavItem {
  label: string;
  href: string;
  kind: 'route' | 'anchor';
}

export interface LandingPainGroup {
  title: string;
  summary: string;
  points: string[];
}

export interface EntryLoopItem {
  title: string;
  summary: string;
  steps: string[];
  outcome: string;
  sceneId: LandingSceneAsset['id'];
}

export interface CoreCapability {
  title: string;
  description: string;
  badge?: string;
}

export interface SceneShowcaseItem {
  title: string;
  description: string;
  sceneId: LandingSceneAsset['id'];
}

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

export interface ArchitectureLoopStep {
  stage: string;
  title: string;
  description: string;
  capability: string;
}

export interface LandingContent {
  navItems: ReadonlyArray<MarketingNavItem>;
  header: {
    loginCta: string;
    startCta: string;
    workbenchCta: string;
    mobileMenuTitle: string;
  };
  hero: {
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    supportText: string;
    metrics: ReadonlyArray<{ label: string; value: string }>;
    carouselSceneIds: ReadonlyArray<LandingSceneAsset['id']>;
  };
  homeNarrative: {
    eyebrow: string;
    title: string;
    intro: string;
    painGroups: ReadonlyArray<LandingPainGroup>;
  };
  entryLoop: {
    eyebrow: string;
    title: string;
    description: string;
    items: ReadonlyArray<EntryLoopItem>;
  };
  coreCapabilities: {
    eyebrow: string;
    title: string;
    items: ReadonlyArray<CoreCapability>;
  };
  sceneShowcase: {
    eyebrow: string;
    title: string;
    items: ReadonlyArray<SceneShowcaseItem>;
  };
  finalCta: {
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  architecture: {
    eyebrow: string;
    title: string;
    description: string;
    loopTitle: string;
    loopSteps: ReadonlyArray<ArchitectureLoopStep>;
    mappingTitle: string;
    mappingBullets: ReadonlyArray<string>;
  };
  security: {
    eyebrow: string;
    title: string;
    description: string;
    cards: ReadonlyArray<{ title: string; description: string }>;
    governanceTitle: string;
    governanceBullets: ReadonlyArray<string>;
  };
  pricing: {
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
    plans: ReadonlyArray<PricingPlan>;
    featureRows: ReadonlyArray<PricingFeatureRow>;
  };
  contact: {
    eyebrow: string;
    title: string;
    cards: ReadonlyArray<{ title: string; description: string; cta: string; href: string }>;
  };
}

export const DEFAULT_CTA_HREF = '/login';
export const WECHAT_QR_IMAGE_URL =
  'https://placehold.co/360x360/png?text=Knowra+WeChat+QR+Placeholder';
export const OFFICIAL_EMAIL = 'support@knowra.ai';

const MARKETING_CONTENT: LandingContent = {
  navItems: [
    { label: '产品重点', href: '/#product-focus', kind: 'anchor' },
    { label: '架构闭环', href: '/architecture', kind: 'route' },
    { label: '安全管控', href: '/security', kind: 'route' },
    { label: '产品定价', href: '/pricing', kind: 'route' },
    { label: '联系官方', href: '/contact', kind: 'route' },
  ],
  header: {
    loginCta: '登录',
    startCta: '免费开始',
    workbenchCta: '进入工作台',
    mobileMenuTitle: '导航菜单',
  },
  hero: {
    title: '新一代智能化知识管理工具',
    description:
      'Knowra 把 AI 变成知识工作的底层能力，贯穿提问、导入、写作与整理。结果不仅能生成，更能长期管理、复用与分享。',
    primaryCta: '免费开始',
    secondaryCta: '查看架构',
    supportText: '3 分钟快速上手',
    metrics: [
      { label: '开始', value: 'AI / 知识库' },
      { label: '输出可沉淀', value: '页面级资产' },
      { label: '协作可扩展', value: '个人到团队' },
    ],
    carouselSceneIds: [
      'ai-question-internet',
      'ai-insert-panel',
      'editor-ai-toolbar',
      'editor-ai-result',
      'ai-search-all-knowledge',
    ],
  },
  homeNarrative: {
    eyebrow: '为什么需要新一代知识管理',
    title: '长期与效率结合',
    intro:
      '传统知识库和纯聊天式 AI 都有明显断层。打通“生成-沉淀-复用”全链路，让每次产出都变成下一次效率。',
    painGroups: [
      {
        title: '上一代知识工具的问题',
        summary: '沉淀成本高，后续检索和复用效率持续下降。',
        points: [
          '长期依赖手工整理，内容越多越难维护',
          '只靠关键词检索，常常找不到需要的片段',
          '知识在库里，行动却在别处，链路割裂',
        ],
      },
      {
        title: '纯 AI 对话的问题',
        summary: '生成很快，但难以形成可信、可复用的资产。',
        points: [
          '结论散落在会话里，无法沉淀为结构化页面',
          '缺少与你资料的绑定，答案可验证性不足',
          '需要重复搬运到文档，协作成本高',
        ],
      },
    ],
  },
  entryLoop: {
    eyebrow: '双入口',
    title: '从 Knowra AI 或知识库空间开始',
    description:
      '你可以先问再沉淀，也可以先整理再调用。两条入口最终都会把结果汇总到可协作、可追踪、可对外分享的知识资产。',
    items: [
      {
        title: '从 Knowra AI 开始',
        summary: '适合已经有目标，想快速产出草稿、结论或方案。',
        steps: ['提问并生成草稿', '人工确认并调整', '一键写入空间页面', '后续问题优先基于沉淀回答'],
        outcome: '想法立即进入可管理空间，避免“一次性聊天产出”。',
        sceneId: 'ai-question-internet',
      },
      {
        title: '从知识库空间开始',
        summary: '适合已有资料，希望先组织内容再持续调用。',
        steps: ['导入附件与文件', '组织页面树结构', '在编辑中使用 AI 扩写/改写/总结', '按空间对外共享或站点化'],
        outcome: '资料被持续激活，团队知识真正可复用。',
        sceneId: 'ai-insert-panel',
      },
    ],
  },
  coreCapabilities: {
    eyebrow: '核心能力',
    title: '围绕“可沉淀、可调用、可协作”的关键能力集',
    items: [
      { title: 'AI 辅助写作与整理', description: '提问、扩写、改写、总结，在编辑流程中即开即用。' },
      { title: '导入与解析', description: '附件解析与文件导入转换，快速把资料变成页面。' },
      { title: '知识库问答', description: '基于你的内容进行理解和检索式回答。' },
      { title: '共享与站点化', description: '页面/空间共享与对外展示，支持持续传播。', badge: 'Pro' },
      { title: '导出与迁移', description: '支持 Markdown / PDF / Word 导出，保证资产可迁移。' },
      { title: '协作与治理基础', description: '面向个人与团队的权限边界与协作分工。' },
    ],
  },
  sceneShowcase: {
    eyebrow: '典型场景',
    title: '从输入到交付的连续路径',
    items: [
      {
        title: 'Knowra AI 发起问题（互联网）',
        description: '关闭空间检索，只使用互联网上下文，快速得到可用回答。',
        sceneId: 'ai-question-internet',
      },
      {
        title: '回复内容插入页面',
        description: '直接打开插入面板，把 AI 结果写入既有空间文档。',
        sceneId: 'ai-insert-panel',
      },
      {
        title: '编辑器唤起 AI 工具栏',
        description: '在文档内选中内容后直接触发 Knowra AI 工具栏。',
        sceneId: 'editor-ai-toolbar',
      },
      {
        title: '编辑器内执行 AI 功能',
        description: '执行改写后立即获得结果，并可替换到当前文档。',
        sceneId: 'editor-ai-result',
      },
      {
        title: '检索所有知识库',
        description: '开启空间检索并选择全部知识库，获取内部知识优先答案。',
        sceneId: 'ai-search-all-knowledge',
      },
    ],
  },
  finalCta: {
    title: '现在开始，把知识工作变成可复用资产',
    description: '从一个问题或一份资料开始，逐步构建你的长期知识闭环。',
    primaryCta: '免费开始',
    secondaryCta: '查看架构',
  },
  architecture: {
    eyebrow: '架构闭环',
    title: '围绕真实知识工作路径设计，而不是孤立功能拼接',
    description:
      'Knowra 的架构重点是“输入、理解、沉淀、协作、传播”连续流转。每个阶段都有明确能力承接，避免流程中断。',
    loopTitle: '闭环阶段',
    loopSteps: [
      { stage: '01', title: '输入统一化', description: '导入附件、文档与历史页面形成统一知识源。', capability: '导入解析 / 空间组织' },
      { stage: '02', title: '检索与理解', description: '按互联网、当前空间或指定空间控制回答范围。', capability: '知识库问答 / 范围控制' },
      { stage: '03', title: '结果沉淀', description: 'AI 输出可直接进入页面并持续迭代。', capability: '编辑器内 AI / 页面写入' },
      { stage: '04', title: '协作与传播', description: '共享、评论与站点化发布推动结果扩散。', capability: '共享 / 站点化 / 导出' },
    ],
    mappingTitle: '能力映射',
    mappingBullets: [
      '双入口（Knowra AI / 知识库空间）共同回到同一闭环',
      '每个阶段都能直接产生可维护的知识页面',
      '从个人使用平滑扩展到小团队协作',
    ],
  },
  security: {
    eyebrow: '安全管控',
    title: '覆盖数据、内容与模型密钥的基础防护与治理边界',
    description: '面向个人与团队协作场景，确保知识资产在可控边界内流转。',
    cards: [
      { title: '用户数据保护', description: '默认传输链路安全与租户边界隔离，保障账号与数据边界。' },
      { title: '知识内容保护', description: '空间/页面可见性与共享范围可配置，降低误共享风险。' },
      { title: '模型密钥安全', description: 'API Key 加密存储与脱敏展示，按最小权限原则管理。' },
    ],
    governanceTitle: '治理边界说明',
    governanceBullets: ['个人空间与团队空间边界清晰', '支持按协作关系控制访问', '企业私有化与合规诉求可沟通扩展'],
  },
  pricing: {
    eyebrow: '产品定价',
    title: '个人免费，付费套餐按年订阅',
    billingNote: '付费套餐按年订阅，支持按席位扩展',
    compareTitle: '功能对比',
    columns: { feature: '功能', free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' },
    plans: [
      {
        tier: 'free',
        name: 'Free',
        priceLabel: '¥0',
        description: '个人基础使用，快速开始知识管理与基础问答。',
        ctaLabel: '免费开始',
        benefits: ['个人空间', '基础 AI 问答', '文档导入与检索'],
      },
      {
        tier: 'pro',
        name: 'Pro',
        priceLabel: '¥99/年',
        description: '面向个人创作者，解锁更高阶的知识工作体验。',
        ctaLabel: '升级到 Pro',
        benefits: ['空间共享高级设置', '更高问答容量', '优先体验新能力'],
        highlighted: true,
      },
      {
        tier: 'team',
        name: 'Team',
        priceLabel: '¥99/人/年',
        description: '面向团队协作，提供成员协同和权限治理能力。',
        ctaLabel: '开始团队版',
        benefits: ['成员邀请与协作', '角色与权限治理', '团队知识空间管理'],
      },
      {
        tier: 'enterprise',
        name: 'Enterprise',
        priceLabel: '联系销售',
        description: '企业级合规与定制支持，满足复杂组织落地要求。',
        ctaLabel: '联系销售',
        benefits: ['私有化部署支持', '高级安全与审计策略', '专属技术支持'],
      },
    ],
    featureRows: [
      { feature: '个人文档管理与基础 AI 问答', free: true, pro: true, team: true, enterprise: true },
      { feature: '空间共享高级设置', free: false, pro: true, team: true, enterprise: true },
      { feature: '团队协作成员管理', free: false, pro: false, team: true, enterprise: true },
      { feature: '角色与权限治理', free: false, pro: false, team: true, enterprise: true },
      { feature: '私有化/专属支持', free: false, pro: false, team: 'optional', enterprise: true },
    ],
  },
  contact: {
    eyebrow: '联系官方',
    title: '保持沟通，快速获得支持与合作响应',
    cards: [
      {
        title: '加入官方社群',
        description: '扫码加入微信社群，获取产品更新与实践交流。',
        cta: '查看社群二维码',
        href: '#community-qr',
      },
      {
        title: '邮箱联系',
        description: '企业合作、功能咨询或反馈建议，请通过官方邮箱联系。',
        cta: OFFICIAL_EMAIL,
        href: `mailto:${OFFICIAL_EMAIL}`,
      },
      {
        title: '企业合作沟通',
        description: '如需私有化部署、模型策略与合规方案，可邮件预约沟通。',
        cta: '发起合作咨询',
        href: `mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent('Knowra 企业合作咨询')}`,
      },
    ],
  },
};

const LANDING_SCENES: ReadonlyArray<LandingSceneAsset> = [
  {
    id: 'ai-question-internet',
    title: 'Ask with Internet Scope',
    caption: 'Use internet-only mode to ask a concrete business question.',
    src: '/landing/scenes/ai-question-internet.png',
    fallbackSrc: '/landing/placeholders/ai-question-internet.svg',
    alt: 'Knowra AI conversation using internet-only mode',
  },
  {
    id: 'ai-insert-panel',
    title: 'Insert Response to Page',
    caption: 'Open insert panel and send response into a structured page.',
    src: '/landing/scenes/ai-insert-panel.png',
    fallbackSrc: '/landing/placeholders/ai-insert-panel.svg',
    alt: 'Knowra AI insert-to-page panel opened',
  },
  {
    id: 'editor-ai-toolbar',
    title: 'Editor Inline AI Toolbar',
    caption: 'Summon AI toolbar directly from selected text in editor.',
    src: '/landing/scenes/editor-ai-toolbar.png',
    fallbackSrc: '/landing/placeholders/editor-ai-toolbar.svg',
    alt: 'Knowra editor with inline AI toolbar opened',
  },
  {
    id: 'editor-ai-result',
    title: 'Inline AI Result in Editor',
    caption: 'Run inline AI action and generate replacement text in context.',
    src: '/landing/scenes/editor-ai-result.png',
    fallbackSrc: '/landing/placeholders/editor-ai-result.svg',
    alt: 'Knowra editor showing inline AI generated result',
  },
  {
    id: 'ai-search-all-knowledge',
    title: 'Search All Knowledge Bases',
    caption: 'Enable all-space retrieval to answer with internal knowledge context.',
    src: '/landing/scenes/ai-search-all-knowledge.png',
    fallbackSrc: '/landing/placeholders/ai-search-all-knowledge.svg',
    alt: 'Knowra AI conversation with all knowledge bases enabled',
  },
];

export function getLandingContent(locale: LandingLocale): LandingContent {
  if (locale === 'en') {
    return MARKETING_CONTENT;
  }
  return MARKETING_CONTENT;
}

export function getLandingScenes(): ReadonlyArray<LandingSceneAsset> {
  return LANDING_SCENES;
}

export function getLandingSceneById(id: LandingSceneAsset['id']): LandingSceneAsset {
  const found = LANDING_SCENES.find((scene) => scene.id === id);
  if (!found) {
    throw new Error(`Unknown landing scene id: ${id}`);
  }
  return found;
}
