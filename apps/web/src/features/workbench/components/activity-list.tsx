import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    <Card className="flex h-full flex-col border-none shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>当日动态</CardTitle>
          <div className="text-sm text-muted-foreground">
            {format(selectedDate, 'yyyy年M月d日')} · {items.length} 条
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="relative h-full overflow-y-auto rounded-md">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow className="text-xs text-muted-foreground">
              <TableHead className="w-[140px]">名称</TableHead>
              <TableHead>详情</TableHead>
              <TableHead className="w-[80px]">时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="p-0">
                    <div className="rounded-lg p-6 text-center text-sm text-muted-foreground">
                      加载中…
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={3} className="p-0">
                    <div className="rounded-lg p-6 text-center text-sm text-destructive">
                      {error}
                    </div>
                  </TableCell>
                </TableRow>
              ) : activityItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="p-0">
                    <div className="rounded-lg p-6 text-center text-sm text-muted-foreground">
                      当天暂无动态，点击上方网格选择其他日期。
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                activityItems.map((item) => (
                  <TableRow key={item.id} className="text-sm">
                    <TableCell className="font-medium">
                      {item.actionName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.content}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.time}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
