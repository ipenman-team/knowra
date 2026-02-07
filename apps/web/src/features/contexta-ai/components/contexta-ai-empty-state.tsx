import { BotIcon } from '@/components/icon/bot.icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function ContextaAiEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <Avatar className="h-16 w-16">
        <AvatarImage src="" />
        <AvatarFallback>
          <BotIcon fill="#3b82f6" />
        </AvatarFallback>
      </Avatar>
      <div className="text-xl font-bold tracking-tight">
        Hi，有什么可以帮助你的？
      </div>
    </div>
  );
}
