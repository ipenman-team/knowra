import type {
  ModerateCommentContentInput,
  ModerateCommentContentResult,
  CommentRiskCategory,
} from '@knowra/domain';
import {
  DEFAULT_MODERATION_KEYWORD_GROUPS,
  type ModerationKeywordGroup,
  type ModerationSeverity,
} from './moderation-keywords';

const POLICY_VERSION = 'comment-m1-open-source-seed-2026-02-19';

function normalizeForMatch(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

function compareSeverity(a: ModerationSeverity, b: ModerationSeverity): ModerationSeverity {
  if (a === 'REJECT' || b === 'REJECT') return 'REJECT';
  return 'REVIEW';
}

export class ModerateCommentContentUseCase {
  constructor(
    private readonly keywordGroups: ModerationKeywordGroup[] = DEFAULT_MODERATION_KEYWORD_GROUPS,
  ) {}

  moderate(input: ModerateCommentContentInput): ModerateCommentContentResult {
    const text = typeof input.text === 'string' ? input.text.trim() : '';
    if (!text) {
      return {
        status: 'PASS',
        riskCategories: [],
        riskScore: 0,
        hitTerms: [],
        policyVersion: POLICY_VERSION,
      };
    }

    const normalizedText = normalizeForMatch(text);
    const hitTerms: string[] = [];
    const categories = new Set<CommentRiskCategory>();
    let severity: ModerationSeverity | null = null;

    for (const group of this.keywordGroups) {
      for (const term of group.terms) {
        const normalizedTerm = normalizeForMatch(term);
        if (!normalizedTerm) continue;
        if (!normalizedText.includes(normalizedTerm)) continue;

        hitTerms.push(term);
        categories.add(group.category);
        severity = severity ? compareSeverity(severity, group.severity) : group.severity;
      }
    }

    const dedupedHitTerms = [...new Set(hitTerms)].slice(0, 20);
    const riskCategories = [...categories];

    if (!severity) {
      return {
        status: 'PASS',
        riskCategories,
        riskScore: 0,
        hitTerms: dedupedHitTerms,
        policyVersion: POLICY_VERSION,
      };
    }

    const riskScoreBase = severity === 'REJECT' ? 80 : 50;
    const riskScore = Math.min(100, riskScoreBase + dedupedHitTerms.length * 5);

    return {
      status: severity,
      riskCategories,
      riskScore,
      hitTerms: dedupedHitTerms,
      policyVersion: POLICY_VERSION,
    };
  }
}
