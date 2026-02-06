import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityItem } from '@contexta/shared';
import { mapActivityItems } from './activity-list-helper';

type ActivityListProps = {
  selectedDate: Date;
  items: ActivityItem[];
  loading?: boolean;
  error?: string | null;
};

export function ActivityList({
  selectedDate,
  items,
  loading,
  error,
}: ActivityListProps) {
  const activityItems = mapActivityItems(items);

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>当日动态</CardTitle>
          <div className="text-sm text-muted-foreground">
            {format(selectedDate, 'yyyy年M月d日')} · {items.length} 条
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 border-b pb-2 text-xs text-muted-foreground sm:grid-cols-[140px_1fr_80px]">
            <div>名称</div>
            <div>详情</div>
            <div>时间</div>
          </div>
          {loading ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              加载中…
            </div>
          ) : error ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-destructive">
              {error}
            </div>
          ) : activityItems.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              当天暂无动态，点击上方网格选择其他日期。
            </div>
          ) : (
            <div className="divide-y">
              {activityItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-2 py-3 text-sm sm:grid-cols-[140px_1fr_80px]"
                >
                  <div className="font-medium">{item.actionName}</div>
                  <div className="text-muted-foreground">{item.content}</div>
                  <div>{item.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
