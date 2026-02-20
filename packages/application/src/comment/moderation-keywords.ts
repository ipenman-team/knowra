import type { CommentRiskCategory } from '@knowra/domain';

export type ModerationSeverity = 'REJECT' | 'REVIEW';

export type ModerationKeywordGroup = {
  category: CommentRiskCategory;
  severity: ModerationSeverity;
  terms: string[];
};

// Seed terms are curated from open-source moderation wordlists and project-specific policy.
// References:
// - https://github.com/houbb/sensitive-word-data
// - https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
export const DEFAULT_MODERATION_KEYWORD_GROUPS: ModerationKeywordGroup[] = [
  {
    category: 'PROFANITY',
    severity: 'REJECT',
    terms: [
      '傻逼',
      '傻x',
      '垃圾人',
      '垃圾货色',
      '去死',
      'fuck',
      'shit',
      'bitch',
      'asshole',
    ],
  },
  {
    category: 'PORN',
    severity: 'REJECT',
    terms: ['约炮', '色情', '裸聊', '成人影片', '嫖娼', 'porn', 'xxx', '成人视频'],
  },
  {
    category: 'GAMBLING',
    severity: 'REJECT',
    terms: ['赌博', '博彩', '赌场', '赌球', '六合彩', 'casino', 'betting'],
  },
  {
    category: 'DRUGS',
    severity: 'REJECT',
    terms: ['毒品', '冰毒', '海洛因', '大麻交易', 'k粉', 'drug dealer', 'cocaine'],
  },
  {
    category: 'POLITICS',
    severity: 'REVIEW',
    terms: ['反政府', '颠覆政权', '政治煽动', '敏感政治', 'political overthrow'],
  },
];
