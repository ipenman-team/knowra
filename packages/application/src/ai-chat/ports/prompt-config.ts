/**
 * Prompt 配置端口
 * 定义系统提示词和上下文管理策略
 */

export interface PromptConfig {
  /**
   * 系统提示词
   */
  systemPrompt: string;

  /**
   * 最近消息条数限制（用于构建上下文）
   */
  contextWindowSize: number;

  /**
   * 是否过滤系统消息
   */
  filterSystemMessages: boolean;
}

export interface PromptConfigProvider {
  /**
   * 获取提示词配置
   */
  getConfig(): PromptConfig;

  /**
   * 获取系统提示词（可自定义）
   */
  getSystemPrompt(): string;
}
