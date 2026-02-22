import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Markdown } from '@/components/shared/markdown';

import type { KnowraAiMessage } from '@/features/knowra-ai/types';
import { BotIcon } from '@/components/icon/bot.icon';

export function KnowraAiMessageItem(props: { message: KnowraAiMessage }) {
  const m = props.message;

  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-sm">
          {m.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Avatar className="mt-0.5 h-7 w-7 shrink-0">
        <AvatarImage src="" />
        <AvatarFallback className="bg-background">
          <BotIcon fill="#3b82f6" />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="rounded-xl border bg-background p-3">
          <Markdown content={m.content} />
        </div>
      </div>
    </div>
  );
}
