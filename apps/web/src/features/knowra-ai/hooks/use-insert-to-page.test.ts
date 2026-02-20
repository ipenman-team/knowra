import { describe, expect, it } from 'vitest';

import {
  buildPageTitle,
  isPlaceholderParagraphOnly,
} from './use-insert-to-page';

describe('buildPageTitle', () => {
  it('uses the first non-empty markdown line as title', () => {
    const title = buildPageTitle({
      markdownContent: '\n##  计划概览\n正文',
      conversationTitle: '对话标题',
      fallbackTitle: '无标题',
    });

    expect(title).toBe('计划概览');
  });

  it('falls back to conversation title when markdown has no content', () => {
    const title = buildPageTitle({
      markdownContent: '   \n \n',
      conversationTitle: '  需求讨论  ',
      fallbackTitle: '无标题',
    });

    expect(title).toBe('需求讨论');
  });

  it('falls back to default title when markdown and conversation title are empty', () => {
    const title = buildPageTitle({
      markdownContent: '',
      conversationTitle: '   ',
      fallbackTitle: '无标题',
    });

    expect(title).toBe('无标题');
  });

  it('truncates title to 30 chars', () => {
    const title = buildPageTitle({
      markdownContent: '# 12345678901234567890123456789012345',
      conversationTitle: '',
      fallbackTitle: '无标题',
    });

    expect(title).toBe('123456789012345678901234567890');
  });
});

describe('isPlaceholderParagraphOnly', () => {
  it('returns true for the default placeholder paragraph', () => {
    expect(
      isPlaceholderParagraphOnly([
        {
          type: 'paragraph',
          children: [{ text: '' }],
        },
      ]),
    ).toBe(true);
  });

  it('returns false when paragraph text is not empty', () => {
    expect(
      isPlaceholderParagraphOnly([
        {
          type: 'paragraph',
          children: [{ text: 'hello' }],
        },
      ]),
    ).toBe(false);
  });
});

