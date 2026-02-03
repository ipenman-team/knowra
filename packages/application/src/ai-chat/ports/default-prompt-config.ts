/**
 * 默认 Prompt 配置实现
 * 包含默认系统提示词和上下文管理规则
 */

import type { PromptConfig, PromptConfigProvider } from './prompt-config';

export const DEFAULT_SYSTEM_PROMPT = [
  '你是一个专业的 AI 助手：',
  '1. 回答简洁',
  '2. 使用结构化表达',
  '3. 给出必要示例',
].join('\n');

export const DEFAULT_CONTEXT_WINDOW_SIZE = 50; // 最近 N 条消息（默认保持与之前一致）

export class DefaultPromptConfigProvider implements PromptConfigProvider {
  private systemPrompt: string;
  private contextWindowSize: number;

  constructor(options?: {
    systemPrompt?: string;
    contextWindowSize?: number;
  }) {
    this.systemPrompt = options?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    this.contextWindowSize = options?.contextWindowSize ?? DEFAULT_CONTEXT_WINDOW_SIZE;
  }

  getConfig(): PromptConfig {
    return {
      systemPrompt: this.systemPrompt,
      contextWindowSize: this.contextWindowSize,
      filterSystemMessages: true,
    };
  }

  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  updateSystemPrompt(prompt: string): void {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('System prompt cannot be empty');
    }
    this.systemPrompt = prompt.trim();
  }

  updateContextWindowSize(size: number): void {
    if (size < 1) {
      throw new Error('Context window size must be at least 1');
    }
    this.contextWindowSize = Math.floor(size);
  }
}
