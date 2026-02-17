import { useMemo } from 'react';

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
import { Empty } from '@/components/empty';
import { useI18n } from '@/lib/i18n/provider';

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
  const { t, locale } = useI18n();
  const activityItems = mapActivityItems(items);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [locale],
  );

  return (
    <Card className="flex h-full flex-col border-none shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{t('workbench.dayActivityTitle')}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {dateFormatter.format(selectedDate)} · {items.length}{' '}
            {t('workbench.itemSuffix')}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="relative h-full overflow-y-auto rounded-md">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow className="text-xs text-muted-foreground">
                <TableHead className="w-[140px]">{t('workbench.name')}</TableHead>
                <TableHead>{t('workbench.detail')}</TableHead>
                <TableHead className="w-[80px]">{t('workbench.time')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="p-0">
                    <div className="rounded-lg p-6 text-center text-sm text-muted-foreground">
                      {t('common.loading')}
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
                    <Empty className="border-0 p-4" text={t('workbench.noActivity')} />
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
