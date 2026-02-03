import type { AiMessage, AiMessageRole } from '@contexta/domain';
import type {
  AiConversationRepository,
  AiMessageRepository,
} from '@contexta/domain';
import { AiConversationNotFoundError } from './errors';
import type { AiChatMessage, AiChatProvider } from './ports/ai-chat-provider';
import type { PromptConfigProvider } from './ports/prompt-config';
import { DefaultPromptConfigProvider } from './ports/default-prompt-config';

function toChatRole(role: AiMessageRole): AiChatMessage['role'] | null {
  if (role === 'USER') return 'user';
  if (role === 'ASSISTANT') return 'assistant';
  if (role === 'SYSTEM') return 'system';
  return null;
}

export class AiChatUseCase {
  private promptConfigProvider: PromptConfigProvider;

  constructor(
    private readonly conversationRepo: AiConversationRepository,
    private readonly messageRepo: AiMessageRepository,
    private readonly chatProvider: AiChatProvider,
    promptConfigProvider?: PromptConfigProvider,
  ) {
    this.promptConfigProvider = promptConfigProvider ?? new DefaultPromptConfigProvider();
  }

  private buildSystemPrompt(): string {
    return this.promptConfigProvider.getSystemPrompt();
  }

  private async ensureConversation(params: {
    tenantId: string;
    conversationId: string;
  }) {
    const conversation = await this.conversationRepo.getById({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });
    if (!conversation) throw new AiConversationNotFoundError(params.conversationId);
    return conversation;
  }

  private async listRecentMessages(params: {
    tenantId: string;
    conversationId: string;
    limit?: number;
  }): Promise<AiMessage[]> {
    const config = this.promptConfigProvider.getConfig();
    const messageLimit = params.limit ?? config.contextWindowSize;
    
    return await this.messageRepo.listByConversation({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      limit: messageLimit,
    });
  }

  private toProviderMessages(params: {
    history: AiMessage[];
    userInput: string;
  }): AiChatMessage[] {
    const config = this.promptConfigProvider.getConfig();
    const messages: AiChatMessage[] = [
      { role: 'system', content: this.buildSystemPrompt() },
    ];

    for (const m of params.history) {
      const role = toChatRole(m.role);
      if (!role) continue;
      // 过滤系统消息（根据配置）
      if (role === 'system' && config.filterSystemMessages) continue;
      const content = (m.content ?? '').trim();
      if (!content) continue;
      messages.push({ role, content });
    }

    messages.push({ role: 'user', content: params.userInput });
    return messages;
  }

  async answer(params: {
    tenantId: string;
    conversationId: string;
    message: string;
    actorUserId: string;
  }): Promise<{ content: string; model: string }>{
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.conversationId) throw new Error('conversationId is required');
    if (!params.actorUserId) throw new Error('actorUserId is required');

    const input = (params.message ?? '').trim();
    if (!input) throw new Error('message is required');

    await this.ensureConversation({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });

    const history = await this.listRecentMessages({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });

    await this.messageRepo.create({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      role: 'USER',
      content: input,
      model: null,
      actorUserId: params.actorUserId,
    });

    const providerMessages = this.toProviderMessages({
      history,
      userInput: input,
    });

    const result = await this.chatProvider.generate(providerMessages);
    const content = String(result?.content ?? '').trim();

    const model = this.chatProvider.model;

    await this.messageRepo.create({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      role: 'ASSISTANT',
      content,
      model,
      actorUserId: params.actorUserId,
    });

    await this.conversationRepo.touch({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      actorUserId: params.actorUserId,
    });

    return { content, model };
  }

  answerStream(params: {
    tenantId: string;
    conversationId: string;
    message: string;
    actorUserId: string;
    signal?: AbortSignal;
  }): AsyncIterable<string> {
    const self = this;

    async function* run(): AsyncGenerator<string> {
      if (!params.tenantId) throw new Error('tenantId is required');
      if (!params.conversationId) throw new Error('conversationId is required');
      if (!params.actorUserId) throw new Error('actorUserId is required');

      const input = (params.message ?? '').trim();
      if (!input) throw new Error('message is required');

      await self.ensureConversation({
        tenantId: params.tenantId,
        conversationId: params.conversationId,
      });

      const history = await self.listRecentMessages({
        tenantId: params.tenantId,
        conversationId: params.conversationId,
      });

      await self.messageRepo.create({
        tenantId: params.tenantId,
        conversationId: params.conversationId,
        role: 'USER',
        content: input,
        model: null,
        actorUserId: params.actorUserId,
      });

      const providerMessages = self.toProviderMessages({
        history,
        userInput: input,
      });

      const stream = self.chatProvider.generateStream?.(providerMessages, {
        signal: params.signal,
      });

      if (!stream) {
        const r = await self.chatProvider.generate(providerMessages);
        const full = String(r?.content ?? '');
        if (full) yield full;

        await self.messageRepo.create({
          tenantId: params.tenantId,
          conversationId: params.conversationId,
          role: 'ASSISTANT',
          content: String(full).trim(),
          model: self.chatProvider.model,
          actorUserId: params.actorUserId,
        });

        await self.conversationRepo.touch({
          tenantId: params.tenantId,
          conversationId: params.conversationId,
          actorUserId: params.actorUserId,
        });

        return;
      }

      let acc = '';
      for await (const delta of stream) {
        if (typeof delta !== 'string' || delta.length === 0) continue;
        acc += delta;
        yield delta;
      }

      await self.messageRepo.create({
        tenantId: params.tenantId,
        conversationId: params.conversationId,
        role: 'ASSISTANT',
        content: acc.trim(),
        model: self.chatProvider.model,
        actorUserId: params.actorUserId,
      });

      await self.conversationRepo.touch({
        tenantId: params.tenantId,
        conversationId: params.conversationId,
        actorUserId: params.actorUserId,
      });
    }

    return run();
  }
}
