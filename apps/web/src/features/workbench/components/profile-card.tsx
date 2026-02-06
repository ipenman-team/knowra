import { format } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

type ProfileCardProps = {
  name: string;
  greeting: string;
  todayCount: number;
  updatedAt: Date;
  avatarUrl?: string;
  loading?: boolean;
  error?: string | null;
};

export function ProfileCard({
  name,
  greeting,
  todayCount,
  updatedAt,
  avatarUrl,
  loading,
  error,
}: ProfileCardProps) {
  const fallback = name?.trim().slice(0, 1) || 'U';

  return (
    <Card className="h-fit">
      <CardHeader className="items-center text-center">
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20 border">
                <AvatarImage src={avatarUrl ?? ''} alt={`${name} 头像`} />
                <AvatarFallback className="text-lg">
                  {fallback}
                </AvatarFallback>
              </Avatar>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-64">
            <div className="text-sm font-medium">
              今日动态：{loading ? '加载中…' : `${todayCount} 条`}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              最近更新时间：{format(updatedAt, 'HH:mm')}
            </div>
          </HoverCardContent>
        </HoverCard>
        <CardTitle className="mt-3">{name}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {greeting}，今天也要元气满满。
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/40 p-4 text-center">
          <div className="text-xs text-muted-foreground">今日活跃度</div>
          <div className="mt-2 text-2xl font-semibold">
            {loading ? '—' : todayCount}
          </div>
          {error ? (
            <div className="mt-1 text-xs text-destructive">{error}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
