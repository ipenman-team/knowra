import type { AiMessage, AiMessageRole } from '@contexta/domain';
import type {
  AiConversationRepository,
  AiMessageRepository,
} from '@contexta/domain';
import { AiConversationNotFoundError } from './errors';
import type { AiChatMessage, AiChatProvider } from './ports/ai-chat-provider';
import type { PromptConfigProvider } from './ports/prompt-config';
import { DefaultPromptConfigProvider } from './ports/default-prompt-config';
import type { AiKnowledgeSearcher } from '../knowledge/ports/ai-knowledge-searcher';

type AiChatDataSource = {
  internetEnabled?: boolean;
  spaceEnabled?: boolean;
  /**
   * Empty array means search all spaces.
   */
  spaceIds?: string[];
  /**
   * When disabled, prompt context only includes the current query.
   */
  carryContext?: boolean;
};

function normalizeSpaceIds(spaceIds: unknown): string[] {
  if (!Array.isArray(spaceIds)) return [];
  const uniq = new Set<string>();
  for (const raw of spaceIds) {
    if (typeof raw !== 'string') continue;
    const v = raw.trim();
    if (!v) continue;
    uniq.add(v);
  }
  return Array.from(uniq);
}

function toChatRole(role: AiMessageRole): AiChatMessage['role'] | null {
  if (role === 'USER') return 'user';
  if (role === 'ASSISTANT') return 'assistant';
  if (role === 'SYSTEM') return 'system';
  return null;
}

export class AiChatUseCase {
  private promptConfigProvider: PromptConfigProvider;
  private readonly knowledgeSearcher?: AiKnowledgeSearcher;

  constructor(
    private readonly conversationRepo: AiConversationRepository,
    private readonly messageRepo: AiMessageRepository,
    private readonly chatProvider: AiChatProvider,
    promptConfigProvider?: PromptConfigProvider,
    knowledgeSearcher?: AiKnowledgeSearcher,
  ) {
    this.promptConfigProvider =
      promptConfigProvider ?? new DefaultPromptConfigProvider();
    this.knowledgeSearcher = knowledgeSearcher;
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
    if (!conversation)
      throw new AiConversationNotFoundError(params.conversationId);
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
    knowledgeContext?: string;
  }): AiChatMessage[] {
    const config = this.promptConfigProvider.getConfig();
    const messages: AiChatMessage[] = [
      { role: 'system', content: this.buildSystemPrompt() },
    ];

    const knowledgeContext = (params.knowledgeContext ?? '').trim();
    if (knowledgeContext) {
      messages.push({ role: 'system', content: knowledgeContext });
    }

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

  private resolveDataSource(params: { dataSource?: AiChatDataSource }): {
    internetEnabled: boolean;
    spaceEnabled: boolean;
    spaceIds: string[];
    carryContext: boolean;
  } {
    const internetEnabled =
      params.dataSource?.internetEnabled === undefined
        ? true
        : Boolean(params.dataSource.internetEnabled);
    const spaceEnabled =
      params.dataSource?.spaceEnabled === undefined
        ? true
        : Boolean(params.dataSource.spaceEnabled);

    const carryContext =
      params.dataSource?.carryContext === undefined
        ? true
        : Boolean(params.dataSource.carryContext);

    return {
      internetEnabled,
      spaceEnabled,
      spaceIds: spaceEnabled
        ? normalizeSpaceIds(params.dataSource?.spaceIds)
        : [],
      carryContext,
    };
  }

  private async buildKnowledgeContext(params: {
    tenantId: string;
    query: string;
    enabled: boolean;
    spaceIds: string[];
  }): Promise<{ context?: string; itemCount: number }> {
    if (!params.enabled) return { context: undefined, itemCount: 0 };
    if (!this.knowledgeSearcher) return { context: undefined, itemCount: 0 };

    const query = (params.query ?? '').trim();
    if (!query) return { context: undefined, itemCount: 0 };

    try {
      const res = await this.knowledgeSearcher.search({
        tenantId: params.tenantId,
        query,
        topK: 8,
        scope:
          params.spaceIds.length > 0
            ? { spaceIds: params.spaceIds }
            : undefined,
      });

      const items = (res?.items ?? []).filter((x) => (x?.content ?? '').trim());
      if (items.length === 0) return { context: undefined, itemCount: 0 };

      const context = items
        .slice(0, 6)
        .map(
          (c, i) =>
            `【${i + 1} ${c.pageId}#${c.chunkIndex}】\n${String(c.content).trim()}`,
        )
        .join('\n\n');

      return {
        itemCount: items.length,
        context: [
          '你可以参考以下知识库检索到的资料片段来回答用户问题。',
          '要求：仅在资料支持的范围内回答；如果资料不足以回答，请直接说明不知道并可提出 1 个澄清问题。',
          '',
          context,
        ].join('\n'),
      };
    } catch {
      // 知识检索失败时降级为无知识上下文
      return { context: undefined, itemCount: 0 };
    }
  }

  async answer(params: {
    tenantId: string;
    conversationId: string;
    message: string;
    actorUserId: string;
  }): Promise<{ content: string; model: string }> {
    if (!params.tenantId) throw new Error('tenantId is required');
    if (!params.conversationId) throw new Error('conversationId is required');
    if (!params.actorUserId) throw new Error('actorUserId is required');

    const input = (params.message ?? '').trim();
    if (!input) throw new Error('message is required');

    const conversation = await this.ensureConversation({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
    });

    const dataSource = this.resolveDataSource({ dataSource: conversation.dataSource });

    const history = dataSource.carryContext
      ? await this.listRecentMessages({
          tenantId: params.tenantId,
          conversationId: params.conversationId,
        })
      : [];

    const knowledge = await this.buildKnowledgeContext({
      tenantId: params.tenantId,
      query: input,
      enabled: dataSource.spaceEnabled,
      spaceIds: dataSource.spaceIds,
    });

    await this.messageRepo.create({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      role: 'USER',
      content: input,
      model: null,
      actorUserId: params.actorUserId,
    });

    if (!dataSource.internetEnabled && !dataSource.spaceEnabled) {
      const content = '请至少开启一个信息源（互联网或空间）。';
      await this.messageRepo.create({
        tenantId: params.tenantId,
        conversationId: params.conversationId,
        role: 'ASSISTANT',
        content,
        model: null,
        actorUserId: params.actorUserId,
      });
      await this.conversationRepo.touch({
        tenantId: params.tenantId,
        conversationId: params.conversationId,
        actorUserId: params.actorUserId,
      });
      return { content, model: 'none' };
    }

    const model = this.chatProvider.model;

    if (dataSource.internetEnabled && dataSource.spaceEnabled) {
      let ragContent = '';
      if (!knowledge.context || knowledge.itemCount === 0) {
        ragContent = '未在空间知识库中检索到足够资料来回答该问题。';
      } else {
        const ragMessages = this.toProviderMessages({
          history,
          userInput: input,
          knowledgeContext: knowledge.context,
        });
        const ragResult = await this.chatProvider.generate(ragMessages);
        ragContent = String(ragResult?.content ?? '').trim();
      }

      const llmMessages = this.toProviderMessages({
        history,
        userInput: input,
        knowledgeContext: undefined,
      });
      const llmResult = await this.chatProvider.generate(llmMessages);
      const llmContent = String(llmResult?.content ?? '').trim();

      const content = [
        '【空间】',
        ragContent,
        '',
        '【互联网】',
        llmContent,
      ].join('\n');

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

    if (dataSource.spaceEnabled && !dataSource.internetEnabled) {
      if (!knowledge.context || knowledge.itemCount === 0) {
        const content = '未在空间知识库中检索到足够资料来回答该问题。';
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

      const ragMessages = this.toProviderMessages({
        history,
        userInput: input,
        knowledgeContext: knowledge.context,
      });
      const ragResult = await this.chatProvider.generate(ragMessages);
      const content = String(ragResult?.content ?? '').trim();

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

    // internetEnabled only
    const providerMessages = this.toProviderMessages({
      history,
      userInput: input,
      knowledgeContext: undefined,
    });

    const result = await this.chatProvider.generate(providerMessages);
    const content = String(result?.content ?? '').trim();

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

      const conversation = await self.ensureConversation({
        tenantId: params.tenantId,
        conversationId: params.conversationId,
      });

      const dataSource = self.resolveDataSource({
        dataSource: conversation.dataSource,
      });

      const history = dataSource.carryContext
        ? await self.listRecentMessages({
            tenantId: params.tenantId,
            conversationId: params.conversationId,
          })
        : [];

      const knowledge = await self.buildKnowledgeContext({
        tenantId: params.tenantId,
        query: input,
        enabled: dataSource.spaceEnabled,
        spaceIds: dataSource.spaceIds,
      });

      await self.messageRepo.create({
        tenantId: params.tenantId,
        conversationId: params.conversationId,
        role: 'USER',
        content: input,
        model: null,
        actorUserId: params.actorUserId,
      });

      let acc = '';
      const model = self.chatProvider.model;

      if (!dataSource.internetEnabled && !dataSource.spaceEnabled) {
        const full = '请至少开启一个信息源（互联网或空间）。';
        acc += full;
        yield full;

        await self.messageRepo.create({
          tenantId: params.tenantId,
          conversationId: params.conversationId,
          role: 'ASSISTANT',
          content: acc.trim(),
          model: null,
          actorUserId: params.actorUserId,
        });

        await self.conversationRepo.touch({
          tenantId: params.tenantId,
          conversationId: params.conversationId,
          actorUserId: params.actorUserId,
        });

        return;
      }

      async function* streamOrGenerate(
        messages: AiChatMessage[],
      ): AsyncGenerator<string> {
        const s = self.chatProvider.generateStream?.(messages, {
          signal: params.signal,
        });
        if (!s) {
          const r = await self.chatProvider.generate(messages);
          const full = String(r?.content ?? '');
          if (full) yield full;
          return;
        }
        for await (const delta of s) {
          if (typeof delta !== 'string' || delta.length === 0) continue;
          yield delta;
        }
      }

      if (dataSource.internetEnabled && dataSource.spaceEnabled) {
        const head1 = '【空间】\n';
        acc += head1;
        yield head1;

        if (!knowledge.context || knowledge.itemCount === 0) {
          const full = '未在空间知识库中检索到足够资料来回答该问题。';
          acc += full;
          yield full;
        } else {
          const ragMessages = self.toProviderMessages({
            history,
            userInput: input,
            knowledgeContext: knowledge.context,
          });
          for await (const d of streamOrGenerate(ragMessages)) {
            acc += d;
            yield d;
          }
        }

        const sep = '\n\n【互联网】\n';
        acc += sep;
        yield sep;

        const llmMessages = self.toProviderMessages({
          history,
          userInput: input,
          knowledgeContext: undefined,
        });
        for await (const d of streamOrGenerate(llmMessages)) {
          acc += d;
          yield d;
        }
      } else if (dataSource.spaceEnabled && !dataSource.internetEnabled) {
        if (!knowledge.context || knowledge.itemCount === 0) {
          const full = '未在空间知识库中检索到足够资料来回答该问题。';
          acc += full;
          yield full;
        } else {
          const ragMessages = self.toProviderMessages({
            history,
            userInput: input,
            knowledgeContext: knowledge.context,
          });
          for await (const d of streamOrGenerate(ragMessages)) {
            acc += d;
            yield d;
          }
        }
      } else {
        const llmMessages = self.toProviderMessages({
          history,
          userInput: input,
          knowledgeContext: undefined,
        });
        for await (const d of streamOrGenerate(llmMessages)) {
          acc += d;
          yield d;
        }
      }

      await self.messageRepo.create({
        tenantId: params.tenantId,
        conversationId: params.conversationId,
        role: 'ASSISTANT',
        content: acc.trim(),
        model,
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
