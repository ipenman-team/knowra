import { Injectable } from '@nestjs/common';
import type { PromptConfigProvider, PromptConfig } from '@contexta/application';

/**
 * Prompt 配置管理服务
 * 提供 Prompt 相关的配置和管理功能
 */
@Injectable()
export class PromptConfigService {
  constructor(private readonly configProvider: PromptConfigProvider) {}

  /**
   * 获取当前 Prompt 配置
   */
  getConfig(): PromptConfig {
    return this.configProvider.getConfig();
  }

  /**
   * 获取系统提示词
   */
  getSystemPrompt(): string {
    return this.configProvider.getSystemPrompt();
  }
}
