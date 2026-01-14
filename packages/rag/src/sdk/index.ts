import type { ChatProvider } from '../ports/chat-provider';
import type { EmbeddingProvider } from '../ports/embedding-provider';
import type { VectorStore } from '../ports/vector-store';
import { extractKeywords } from '../core/keywords';
import { splitText } from '../core/text-splitter';
import type { RagAnswerResult, RagAnswerStreamEvent } from './types';
import type { RagHooks } from './hooks';

export type RagConfig = {
  vectorStore: VectorStore;
  embeddings: EmbeddingProvider;
  chat: ChatProvider;
  splitter: { chunkSize: number; chunkOverlap: number };
  retrieval: { topK: number; similarityThreshold: number };
  hooks?: RagHooks;
};

export class RAG {
  constructor(private readonly config: RagConfig) {}

  private async safeHook<T>(fn: (() => T | Promise<T>) | undefined): Promise<void> {
    if (!fn) return;
    try {
      await fn();
    } catch {
      // hooks 失败不影响主流程
    }
  }

  async indexText(input: {
    tenantId: string;
    sourceId: string;
    text: string;
    options?: {
      metadata?: Record<string, unknown>;
      chunkIdPrefix?: string;
      overwrite?: 'source';
    };
  }) {
    const started = Date.now();
    const hooks = this.config.hooks;

    await this.safeHook(() =>
      hooks?.onIndexStart?.({ tenantId: input.tenantId, sourceId: input.sourceId }),
    );

    try {
      const plain = (input.text ?? '').trim();

      const prepared = hooks?.prepareIndexText
        ? await hooks.prepareIndexText({
            tenantId: input.tenantId,
            sourceId: input.sourceId,
            text: plain,
          })
        : plain;

      const chunks = splitText(prepared, this.config.splitter);

      const overwrite = input.options?.overwrite ?? 'source';
      const metadata = input.options?.metadata;
      const chunkIdPrefix = input.options?.chunkIdPrefix ?? input.sourceId;

      if (chunks.length === 0) {
        if (overwrite === 'source') {
          await this.config.vectorStore.deleteBySource({
            tenantId: input.tenantId,
            sourceId: input.sourceId,
          });
        }
        const ms = Date.now() - started;
        await this.safeHook(() =>
          hooks?.onIndexEnd?.({
            tenantId: input.tenantId,
            sourceId: input.sourceId,
            chunkCount: 0,
            ms,
          }),
        );
        return { ok: true as const, chunkCount: 0 };
      }

      const contents = chunks.map((c) => c.content);
      const vectors = await this.config.embeddings.embedDocuments(contents);

      if (vectors.length !== chunks.length) {
        throw new Error('embedding result length mismatch');
      }

      for (const v of vectors) {
        if (v.length !== this.config.vectorStore.vectorDim) {
          throw new Error(
            `vectorDim mismatch: expected ${this.config.vectorStore.vectorDim}, got ${v.length}`,
          );
        }
      }

      if (overwrite === 'source') {
        await this.config.vectorStore.deleteBySource({
          tenantId: input.tenantId,
          sourceId: input.sourceId,
        });
      }

      const upsertInput = chunks.map((c, i) => ({
        id: `${chunkIdPrefix}#${c.chunkIndex}`,
        tenantId: input.tenantId,
        sourceId: input.sourceId,
        chunkIndex: c.chunkIndex,
        content: c.content,
        embedding: vectors[i]!,
        metadata,
      }));

      await this.config.vectorStore.upsert(upsertInput);

      const ms = Date.now() - started;
      await this.safeHook(() =>
        hooks?.onIndexEnd?.({
          tenantId: input.tenantId,
          sourceId: input.sourceId,
          chunkCount: chunks.length,
          ms,
        }),
      );
      return { ok: true as const, chunkCount: chunks.length };
    } catch (error) {
      const ms = Date.now() - started;
      await this.safeHook(() =>
        hooks?.onIndexError?.({ tenantId: input.tenantId, sourceId: input.sourceId, error, ms }),
      );
      throw error;
    }
  }

  async answer(input: { tenantId: string; question: string }): Promise<RagAnswerResult> {
    const started = Date.now();
    const hooks = this.config.hooks;

    const rawQuestion = input.question.trim();
    const question = hooks?.prepareQuestion
      ? await hooks.prepareQuestion({ tenantId: input.tenantId, question: rawQuestion })
      : rawQuestion;

    await this.safeHook(() => hooks?.onAnswerStart?.({ tenantId: input.tenantId, question }));

    try {
      const embeddingStart = Date.now();
      const queryEmbedding = await this.config.embeddings.embedQuery(question);
      const embeddingMs = Date.now() - embeddingStart;

      if (queryEmbedding.length !== this.config.vectorStore.vectorDim) {
        throw new Error(
          `vectorDim mismatch: expected ${this.config.vectorStore.vectorDim}, got ${queryEmbedding.length}`,
        );
      }

      const retrieveStart = Date.now();
      const candidates = await this.config.vectorStore.similaritySearch(queryEmbedding, {
        topK: this.config.retrieval.topK,
        filter: { tenantId: input.tenantId },
      });
      const retrieveMs = Date.now() - retrieveStart;

      const passed = candidates.filter(
        (c) => c.score <= this.config.retrieval.similarityThreshold,
      );

      const context = passed
        .map((c, i) => `【${i + 1} ${c.sourceId}#${c.chunkIndex}】\n${c.content}`)
        .join('\n\n');

      const terms = extractKeywords(question).slice(0, 8);
      const lowerContext = context.toLowerCase();
      const covered = terms.filter((t) => lowerContext.includes(t.toLowerCase()));
      const hasCriticalTerms = covered.length > 0;

      const fallback = passed.length === 0 || !hasCriticalTerms;

      const llmStart = Date.now();
      const res = fallback
        ? {
            content: hasCriticalTerms
              ? '我暂时没在知识库里找到足够相关的内容来回答这个问题。'
              : '我不知道（目前检索到的资料没有覆盖你问题里的关键信息）。',
          }
        : await this.config.chat.generate([
            {
              role: 'system',
              content:
                '你是一个面向用户的知识库问答助手。请只依据给定的资料片段回答，不要编造或脑补。用 Markdown 输出，分段清晰：先给结论，再补充必要解释；当步骤/要点更清楚时可以用无序列表；命令或代码用 ``` 代码块；避免空话，不要写“根据上下文/资料”等措辞。如果资料不足以支撑答案，请直接说“我不知道”，并用一句话说明缺少哪类信息；最多提出 1 个澄清问题。',
            },
            {
              role: 'user',
              content: `资料片段：\n${context}\n\n用户问题：\n${question}`,
            },
          ]);
      const llmMs = Date.now() - llmStart;

      const totalMs = Date.now() - started;

      await this.safeHook(() =>
        hooks?.onAnswerEnd?.({
          tenantId: input.tenantId,
          question,
          hit: !fallback,
          ms: totalMs,
        }),
      );

      return {
        answer: res.content,
        hit: !fallback,
        meta: {
          timing: { embeddingMs, retrieveMs, llmMs, totalMs },
          termCoverage: {
            terms,
            covered,
            ratio: terms.length ? covered.length / terms.length : 0,
          },
          retrieval: {
            topK: this.config.retrieval.topK,
            threshold: this.config.retrieval.similarityThreshold,
            candidates: candidates.map((c) => ({ id: c.id, score: c.score, source: 'semantic' })),
            selected: passed.map((c) => ({ id: c.id, score: c.score })),
          },
          fallback: fallback
            ? { reason: passed.length === 0 ? 'no_hit' : 'term_not_covered' }
            : undefined,
          model: {
            chatModel: this.config.chat.model,
            embedModel: this.config.embeddings.model,
            vectorDim: this.config.vectorStore.vectorDim,
          },
        },
      };
    } catch (error) {
      const ms = Date.now() - started;
      await this.safeHook(() =>
        hooks?.onAnswerError?.({ tenantId: input.tenantId, question, error, ms }),
      );
      throw error;
    }
  }

  async *answerStream(
    input: { tenantId: string; question: string },
    options?: { signal?: AbortSignal },
  ): AsyncIterable<RagAnswerStreamEvent> {
    const started = Date.now();
    const hooks = this.config.hooks;

    const rawQuestion = input.question.trim();
    const question = hooks?.prepareQuestion
      ? await hooks.prepareQuestion({ tenantId: input.tenantId, question: rawQuestion })
      : rawQuestion;

    await this.safeHook(() => hooks?.onAnswerStart?.({ tenantId: input.tenantId, question }));

    try {
      const embeddingStart = Date.now();
      const queryEmbedding = await this.config.embeddings.embedQuery(question);
      const embeddingMs = Date.now() - embeddingStart;

      if (queryEmbedding.length !== this.config.vectorStore.vectorDim) {
        throw new Error(
          `vectorDim mismatch: expected ${this.config.vectorStore.vectorDim}, got ${queryEmbedding.length}`,
        );
      }

      const retrieveStart = Date.now();
      const candidates = await this.config.vectorStore.similaritySearch(queryEmbedding, {
        topK: this.config.retrieval.topK,
        filter: { tenantId: input.tenantId },
      });
      const retrieveMs = Date.now() - retrieveStart;

      const passed = candidates.filter((c) => c.score <= this.config.retrieval.similarityThreshold);

      const context = passed
        .map((c, i) => `【${i + 1} ${c.sourceId}#${c.chunkIndex}】\n${c.content}`)
        .join('\n\n');

      const terms = extractKeywords(question).slice(0, 8);
      const lowerContext = context.toLowerCase();
      const covered = terms.filter((t) => lowerContext.includes(t.toLowerCase()));
      const hasCriticalTerms = covered.length > 0;

      const fallback = passed.length === 0 || !hasCriticalTerms;

      const llmStart = Date.now();
      let answerText = '';

      if (fallback) {
        answerText = hasCriticalTerms
          ? '我暂时没在知识库里找到足够相关的内容来回答这个问题。'
          : '我不知道（目前检索到的资料没有覆盖你问题里的关键信息）。';
        yield { type: 'delta', delta: answerText };
      } else {
        const messages = [
          {
            role: 'system' as const,
            content:
              '你是一个面向用户的知识库问答助手。请只依据给定的资料片段回答，不要编造或脑补。用 Markdown 输出，分段清晰：先给结论，再补充必要解释；当步骤/要点更清楚时可以用无序列表；命令或代码用 ``` 代码块；避免空话，不要写“根据上下文/资料”等措辞。如果资料不足以支撑答案，请直接说“我不知道”，并用一句话说明缺少哪类信息；最多提出 1 个澄清问题。',
          },
          {
            role: 'user' as const,
            content: `资料片段：\n${context}\n\n用户问题：\n${question}`,
          },
        ];

        if (this.config.chat.generateStream) {
          for await (const delta of this.config.chat.generateStream(messages, {
            signal: options?.signal,
          })) {
            answerText += delta;
            yield { type: 'delta', delta };
          }
        } else {
          const res = await this.config.chat.generate(messages);
          answerText = String(res.content ?? '');
          if (answerText) {
            yield { type: 'delta', delta: answerText };
          }
        }
      }

      const llmMs = Date.now() - llmStart;
      const totalMs = Date.now() - started;

      await this.safeHook(() =>
        hooks?.onAnswerEnd?.({
          tenantId: input.tenantId,
          question,
          hit: !fallback,
          ms: totalMs,
        }),
      );

      const meta: RagAnswerResult['meta'] = {
        timing: { embeddingMs, retrieveMs, llmMs, totalMs },
        termCoverage: {
          terms,
          covered,
          ratio: terms.length ? covered.length / terms.length : 0,
        },
        retrieval: {
          topK: this.config.retrieval.topK,
          threshold: this.config.retrieval.similarityThreshold,
          candidates: candidates.map((c) => ({ id: c.id, score: c.score, source: 'semantic' })),
          selected: passed.map((c) => ({ id: c.id, score: c.score })),
        },
        fallback: fallback
          ? { reason: passed.length === 0 ? 'no_hit' : 'term_not_covered' }
          : undefined,
        model: {
          chatModel: this.config.chat.model,
          embedModel: this.config.embeddings.model,
          vectorDim: this.config.vectorStore.vectorDim,
        },
      };

      yield { type: 'meta', hit: !fallback, meta };
      yield { type: 'done' };
    } catch (error) {
      const ms = Date.now() - started;
      await this.safeHook(() =>
        hooks?.onAnswerError?.({ tenantId: input.tenantId, question: input.question, error, ms }),
      );
      throw error;
    }
  }
}
