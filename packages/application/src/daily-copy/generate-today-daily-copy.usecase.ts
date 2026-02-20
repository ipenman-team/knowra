import type {
  CreateDailyCopyParams,
  DailyCopyCategory,
  DailyCopyRepository,
} from '@knowra/domain';
import {
  endOfLocalDay,
  formatLocalDayKey,
  normalizeRequiredText,
  safeOneLineText,
} from './utils';

export type DailyCopyChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export interface DailyCopyChatProvider {
  model: string;
  generate(
    messages: DailyCopyChatMessage[],
  ): Promise<{ content: string; usage?: unknown }>;
}

const CATEGORIES: Array<{ key: DailyCopyCategory; label: string }> = [
  { key: 'CLASSIC', label: '经典语录' },
  { key: 'POETRY', label: '诗词（原创，不引用现成诗句）' },
  { key: 'CELEBRITY', label: '名人语录风格（原创，不要捏造真实名人姓名）' },
  { key: 'PHILOSOPHY', label: '哲理' },
  { key: 'POSITIVE', label: '正能量' },
  { key: 'WARM', label: '温暖治愈' },
  { key: 'AESTHETIC', label: '唯美' },
];

function pickRandomCategoryBy(random: () => number): {
  key: DailyCopyCategory;
  label: string;
} {
  const idx = Math.floor(random() * CATEGORIES.length);
  return CATEGORIES[idx] ?? CATEGORIES[0];
}

function buildPrompt(categoryLabel: string): DailyCopyChatMessage[] {
  return [
    {
      role: 'system',
      content:
        '你是中文文案生成器。只输出文案本身，不要输出标题、解释、引号、序号、emoji、Markdown。文案需健康、积极、适合工作台个人主页展示。',
    },
    {
      role: 'user',
      content:
        `请生成一条“${categoryLabel}”类型的短文案。要求：\n` +
        `1) 中文，1-2 句为主；\n` +
        `2) 不要引用真实人物原话、不标注出处；\n` +
        `3) 不要出现敏感/暴力/仇恨/色情内容；\n` +
        `4) 字数尽量控制在 20-60 字。`,
    },
  ];
}

export class GenerateTodayDailyCopyUseCase {
  constructor(
    private readonly repo: DailyCopyRepository,
    private readonly chat: DailyCopyChatProvider,
    private readonly random: () => number = Math.random,
  ) {}

  async generateToday(params: { tenantId: string; userId: string; now?: Date | null }) {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const userId = normalizeRequiredText('userId', params.userId);
    const now = params.now ?? new Date();

    const day = formatLocalDayKey(now);
    const existing = await this.repo.findByDay({ tenantId, userId, day });
    if (existing) return existing;

    const category = pickRandomCategoryBy(this.random);
    const messages = buildPrompt(category.label);
    const result = await this.chat.generate(messages);

    const content = safeOneLineText(result.content, 140);
    if (!content) throw new Error('failed to generate daily copy');

    const createParams: CreateDailyCopyParams = {
      tenantId,
      userId,
      day,
      category: category.key,
      content,
      metadata: { liked: false },
      expiresAt: endOfLocalDay(now),
    };

    try {
      return await this.repo.create(createParams);
    } catch (err) {
      const again = await this.repo.findByDay({ tenantId, userId, day });
      if (again) return again;
      throw err;
    }
  }
}
