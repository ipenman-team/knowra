import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

import type { ContextaAiMessage } from '@/features/contexta-ai/types';
import { formatZhDate } from './utils';
import { ContextaAiMessageItem } from './contexta-ai-message-item';

export function ContextaAiMessageList(props: {
  messages: ContextaAiMessage[];
  loading: boolean;
  error: string | null;
  showRegenerate: boolean;
  onRetry: () => void;
  onRegenerate: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-center text-xs text-muted-foreground">
        {formatZhDate(new Date())} · Contexta AI
      </div>

      {props.loading ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>汲取中</span>
        </div>
      ) : null}

      <div className="mt-3 space-y-4">
        {props.messages.map((m, idx) =>
          m.role === 'assistant' && m.content.trim().length === 0 ? null : (
            <ContextaAiMessageItem key={idx} message={m} />
          ),
        )}
      </div>

      {props.error ? (
        <div className="mt-4 flex items-center gap-3">
          <div className="text-sm text-destructive">{props.error}</div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={props.onRetry}
            disabled={props.loading}
          >
            重试
          </Button>
        </div>
      ) : null}

      {props.showRegenerate ? (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={props.onRegenerate}
          >
            重新生成
          </Button>
        </div>
      ) : null}
    </>
  );
}
