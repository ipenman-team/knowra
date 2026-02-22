import { BotIcon } from '@/components/icon/bot.icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n/provider';

export function KnowraAiEmptyState(props: {
  EmptyContent?: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <Avatar className="h-16 w-16">
        <AvatarImage src="" />
        <AvatarFallback>
          <BotIcon fill="#3b82f6" />
        </AvatarFallback>
      </Avatar>
      {props.EmptyContent ? (
        props.EmptyContent
      ) : (
        <div className="text-xl font-bold tracking-tight">
          {t('knowraAiEmptyState.greeting')}
        </div>
      )}
    </div>
  );
}
