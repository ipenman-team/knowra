import { ModerateCommentContentUseCase } from '../../../../../../packages/application/src/comment';

describe('ModerateCommentContentUseCase', () => {
  test('returns PASS for clean text', () => {
    const useCase = new ModerateCommentContentUseCase();
    const result = useCase.moderate({ text: '这是一条正常的评论内容' });

    expect(result.status).toBe('PASS');
    expect(result.riskCategories).toEqual([]);
    expect(result.hitTerms).toEqual([]);
  });

  test('returns REJECT for profanity', () => {
    const useCase = new ModerateCommentContentUseCase();
    const result = useCase.moderate({ text: '你这个傻逼' });

    expect(result.status).toBe('REJECT');
    expect(result.riskCategories).toContain('PROFANITY');
    expect(result.hitTerms.length).toBeGreaterThan(0);
  });

  test('returns REVIEW for politics category', () => {
    const useCase = new ModerateCommentContentUseCase();
    const result = useCase.moderate({ text: '这里包含反政府倾向词' });

    expect(result.status).toBe('REVIEW');
    expect(result.riskCategories).toContain('POLITICS');
  });
});
