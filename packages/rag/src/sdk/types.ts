export type RagAnswerInput = {
  tenantId: string;
  question: string;
};

export type RagAnswerResult = {
  answer: string;
  hit: boolean;
  meta: {
    timing: Record<string, number>;
    termCoverage: { terms: string[]; covered: string[]; ratio: number };
    retrieval: {
      topK: number;
      threshold: number;
      candidates: Array<{ id: string; score: number; source: 'semantic' }>; // MVP: only semantic
      selected: Array<{ id: string; score: number }>; // selected subset
    };
    fallback?: { reason: string };
    model?: { chatModel: string; embedModel: string; vectorDim: number };
  };
};

export type RagAnswerStreamEvent =
  | { type: 'delta'; delta: string }
  | { type: 'meta'; hit: boolean; meta: RagAnswerResult['meta'] }
  | { type: 'done' };

export type RagIndexTextInput = {
  tenantId: string;
  sourceId: string;
  text: string;
  options?: {
    metadata?: Record<string, unknown>;
    chunkIdPrefix?: string;
    overwrite?: 'source';
  };
};

export type RagSdk = {
  indexText(input: RagIndexTextInput): Promise<{ ok: true; chunkCount: number }>;
  answer(input: RagAnswerInput): Promise<RagAnswerResult>;
  answerStream?(input: RagAnswerInput, options?: { signal?: AbortSignal }): AsyncIterable<RagAnswerStreamEvent>;
};
