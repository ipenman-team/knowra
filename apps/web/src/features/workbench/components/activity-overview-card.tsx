import type { ComponentProps } from 'react';
import { format } from 'date-fns';

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

type ActivityOverviewCardProps = {
  today: Date;
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
  today,
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
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center">
            <CardTitle>活跃度</CardTitle>
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
            {statusText ? (
              <div className="mt-1 text-xs text-muted-foreground">
                {statusText}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
                <SelectValue placeholder="选择年份" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year} 年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {viewMode === 'grid' ? (
          <ActivityGrid {...gridProps} />
        ) : (
          <ActivityLineChart {...lineProps} />
        )}
      </CardContent>
    </Card>
  );
}
