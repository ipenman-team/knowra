import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';

import type { KnowraAiMessage } from '@/features/knowra-ai/types';
import { KnowraAiInsertToPageButton } from './knowra-ai-insert-to-page-button';
import { KnowraAiMessageItem } from './knowra-ai-message-item';

export function KnowraAiMessageList(props: {
  messages: KnowraAiMessage[];
  spaces: Array<{ id: string; name: string }>;
  conversationTitle: string;
  loading: boolean;
  error: string | null;
  showRegenerate: boolean;
  onRetry: () => void;
  onRegenerate: () => void;
}) {
  const { t, locale } = useI18n();
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'numeric',
        day: 'numeric',
        weekday: 'short',
      }),
    [locale],
  );
  const todayLabel = dateFormatter.format(new Date());
  const latestAssistantContent = useMemo(
    () =>
      [...props.messages]
        .reverse()
        .find((message) => message.role === 'assistant' && message.content.trim().length > 0)
        ?.content ?? '',
    [props.messages],
  );

  return (
    <>
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        suppressHydrationWarning
      >
        {todayLabel ? `${todayLabel} · ` : ''}
        Knowra AI
      </div>

      {props.loading ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t('knowraAiMessageList.loading')}</span>
        </div>
      ) : null}

      <div className="mt-3 space-y-4">
        {props.messages.map((m, idx) =>
          m.role === 'assistant' && m.content.trim().length === 0 ? null : (
            <KnowraAiMessageItem key={idx} message={m} />
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
            {t('knowraAiMessageList.retry')}
          </Button>
        </div>
      ) : null}

      {props.showRegenerate ? (
        <div className="mt-4 flex justify-end gap-2">
          {latestAssistantContent ? (
            <KnowraAiInsertToPageButton
              spaces={props.spaces}
              markdownContent={latestAssistantContent}
              conversationTitle={props.conversationTitle}
            />
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={props.onRegenerate}
          >
            {t('knowraAiMessageList.regenerate')}
          </Button>
        </div>
      ) : null}
    </>
  );
}
