import type { AiChatMessage, AiChatProvider } from './ports/ai-chat-provider';
import type { PromptConfigProvider } from './ports/prompt-config';
import { DefaultPromptConfigProvider } from './ports/default-prompt-config';

export type InlineActionType =
  | 'rewrite'
  | 'condense'
  | 'expand'
  | 'summarize'
  | 'translate'
  | 'qa'
  | 'custom';

type InlineActionContext = {
  pageId?: string;
  spaceId?: string;
  mode: 'edit' | 'readonly';
};

const INLINE_ACTION_SELECTED_TEXT_LIMIT = 2000;

function clipSelectedText(input: string): string {
  const normalized = input.trim();
  if (!normalized) return '';
  if (normalized.length <= INLINE_ACTION_SELECTED_TEXT_LIMIT) return normalized;
  return normalized.slice(0, INLINE_ACTION_SELECTED_TEXT_LIMIT);
}

function buildActionInstruction(params: {
  actionType: InlineActionType;
  userPrompt?: string;
  targetLanguage?: string;
}): string {
  const userPrompt = (params.userPrompt ?? '').trim();

  switch (params.actionType) {
    case 'rewrite':
      return '请在保持原意的前提下改写选中文本，表达更自然清晰。';
    case 'condense':
      return '请精简选中文本，删除冗余内容并保留核心信息。';
    case 'expand':
      return '请扩写选中文本，补充必要细节并保持逻辑连贯。';
    case 'summarize':
      return '请总结选中文本，输出简洁摘要。';
    case 'translate': {
      const targetLanguage = (params.targetLanguage ?? '').trim() || '中文';
      return `请将选中文本翻译为${targetLanguage}。`;
    }
    case 'qa':
      return userPrompt
        ? `请仅基于选中文本回答这个问题：${userPrompt}`
        : '请解释选中文本的核心含义。';
    case 'custom':
      if (!userPrompt) {
        throw new Error('userPrompt is required for custom action');
      }
      return userPrompt;
    default:
      throw new Error('actionType invalid');
  }
}

export class InlineActionUseCase {
  private readonly promptConfigProvider: PromptConfigProvider;

  constructor(
    private readonly chatProvider: AiChatProvider,
    promptConfigProvider?: PromptConfigProvider,
  ) {
    this.promptConfigProvider =
      promptConfigProvider ?? new DefaultPromptConfigProvider();
  }

  private buildSystemPrompt(): string {
    const basePrompt = this.promptConfigProvider.getSystemPrompt().trim();
    const inlineRules = [
      '你是文档编辑助手，必须严格围绕用户选中文本执行任务。',
      '仅输出最终文本结果，不要添加额外解释、标题、编号或 markdown 代码块。',
      '除翻译任务外，默认保持与选中文本相同的语言风格。',
    ].join('\n');

    if (!basePrompt) return inlineRules;
    return `${basePrompt}\n\n${inlineRules}`;
  }

  private buildUserMessage(params: {
    selectedText: string;
    actionType: InlineActionType;
    userPrompt?: string;
    targetLanguage?: string;
    context?: InlineActionContext;
  }): string {
    const instruction = buildActionInstruction({
      actionType: params.actionType,
      userPrompt: params.userPrompt,
      targetLanguage: params.targetLanguage,
    });

    const contextLines: string[] = [];
    if (params.context?.mode) {
      contextLines.push(`编辑模式：${params.context.mode}`);
    }
    if (params.context?.spaceId) {
      contextLines.push(`spaceId：${params.context.spaceId}`);
    }
    if (params.context?.pageId) {
      contextLines.push(`pageId：${params.context.pageId}`);
    }

    const sections = [
      `任务类型：${params.actionType}`,
      contextLines.length > 0 ? contextLines.join('\n') : '',
      '',
      '请处理以下选中文本：',
      '<<<SELECTED_TEXT',
      params.selectedText,
      'SELECTED_TEXT>>>',
      '',
      `执行要求：${instruction}`,
    ].filter((x) => x.length > 0);

    return sections.join('\n');
  }

  stream(params: {
    tenantId: string;
    actorUserId: string;
    selectedText: string;
    actionType: InlineActionType;
    userPrompt?: string;
    actionParams?: {
      targetLanguage?: string;
    };
    context?: InlineActionContext;
    signal?: AbortSignal;
  }): AsyncIterable<string> {
    const self = this;

    async function* run(): AsyncGenerator<string> {
      if (!params.tenantId) throw new Error('tenantId is required');
      if (!params.actorUserId) throw new Error('actorUserId is required');

      const selectedText = clipSelectedText(params.selectedText ?? '');
      if (!selectedText) throw new Error('selectedText is required');

      const contextMode = params.context?.mode;
      if (
        contextMode !== undefined &&
        contextMode !== 'edit' &&
        contextMode !== 'readonly'
      ) {
        throw new Error('context.mode invalid');
      }

      const userMessage = self.buildUserMessage({
        selectedText,
        actionType: params.actionType,
        userPrompt: params.userPrompt,
        targetLanguage: params.actionParams?.targetLanguage,
        context: params.context,
      });

      const messages: AiChatMessage[] = [
        { role: 'system', content: self.buildSystemPrompt() },
        { role: 'user', content: userMessage },
      ];

      const stream = self.chatProvider.generateStream?.(messages, {
        signal: params.signal,
      });
      if (!stream) {
        const result = await self.chatProvider.generate(messages);
        const full = String(result?.content ?? '');
        if (full) yield full;
        return;
      }

      for await (const delta of stream) {
        if (typeof delta !== 'string' || delta.length === 0) continue;
        yield delta;
      }
    }

    return run();
  }
}
