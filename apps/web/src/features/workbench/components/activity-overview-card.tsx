import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActivityGrid } from './activity-grid';
import { ActivityLineChart } from './activity-line-chart';
import { ChartLineIcon, Grid3X3Icon, RotateCcwIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';

type ActivityOverviewCardProps = {
  selectedYear: number;
  yearOptions: number[];
  viewMode: 'grid' | 'line';
  onViewModeChange: (mode: 'grid' | 'line') => void;
  onYearChange: (value: string) => void;
  gridProps: ComponentProps<typeof ActivityGrid>;
  lineProps: ComponentProps<typeof ActivityLineChart>;
  statusText?: string | null;
  onJumpToToday?: () => void;
};

export function ActivityOverviewCard({
  selectedYear,
  yearOptions,
  viewMode,
  onViewModeChange,
  onYearChange,
  gridProps,
  lineProps,
  statusText,
  onJumpToToday,
}: ActivityOverviewCardProps) {
  const { t } = useI18n();

  return (
    <Card className="relative border-none shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-center gap-1">
            <CardTitle>{t('workbench.activity')}</CardTitle>
            {onJumpToToday ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={onJumpToToday}
              >
                <RotateCcwIcon />
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center gap-1 rounded-md p-1">
              <Button
                type="button"
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => onViewModeChange('grid')}
              >
                <Grid3X3Icon />
              </Button>
              <Button
                type="button"
                variant={viewMode === 'line' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => onViewModeChange('line')}
              >
                <ChartLineIcon />
              </Button>
            </div>
            <Select value={String(selectedYear)} onValueChange={onYearChange}>
              <SelectTrigger className="h-9 w-[110px]">
                <SelectValue placeholder={t('workbench.selectYear')} />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {statusText ? (
            <div className="text-xs text-muted-foreground">{statusText}</div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-hidden">
        {viewMode === 'grid' ? (
          <ActivityGrid {...gridProps} />
        ) : (
          <ActivityLineChart {...lineProps} />
        )}
      </CardContent>
    </Card>
  );
}
