import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useI18n } from '@/lib/i18n/provider';
import { Share2 } from 'lucide-react';

export function KnowraAiHeader(props: {
  title: string;
  copied: boolean;
  onShare: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="shrink-0 border-b bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{props.title}</div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={t('knowraAiHeader.share')}
                onClick={props.onShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{props.copied ? t('knowraAiHeader.copied') : t('knowraAiHeader.share')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
