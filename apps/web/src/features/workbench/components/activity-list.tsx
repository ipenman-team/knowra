import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityItem } from './activity-data';

type ActivityListProps = {
  selectedDate: Date;
  items: ActivityItem[];
};

export function ActivityList({ selectedDate, items }: ActivityListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>动态</CardTitle>
          <div className="text-sm text-muted-foreground">
            {format(selectedDate, 'yyyy年M月d日')} · {items.length} 条
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 border-b pb-2 text-xs text-muted-foreground sm:grid-cols-[140px_1fr_80px]">
            <div>类型</div>
            <div>内容</div>
            <div>时间</div>
          </div>
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              当天暂无动态，点击上方网格选择其他日期。
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-2 py-3 text-sm sm:grid-cols-[140px_1fr_80px]"
                >
                  <div className="font-medium">{item.type}</div>
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
