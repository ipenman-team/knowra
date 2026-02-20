import type { ActivityItem } from '@knowra/shared';

import { ActivityList } from './activity-list';
import { ActivityOverviewCard } from './activity-overview-card';

export function WorkbenchDashboardPanel(props: {
  selectedDate: Date;
  selectedYear: number;
  yearOptions: number[];
  viewMode: 'grid' | 'line';
  rangeDays: number;
  weeks: Date[][];
  selectedDayKey: string;
  activityMap: Map<string, number>;
  lineData: { date: Date; count: number }[];
  chartSize: { width: number; height: number; padding: number };
  chartPaths: { linePath: string; areaPath: string };
  maxLineCount: number;
  today: Date;
  dailyItems: ActivityItem[];
  dailyLoading: boolean;
  dailyError: string | null;
  statusText?: string | null;
  onViewModeChange: (mode: 'grid' | 'line') => void;
  onYearChange: (value: string) => void;
  onSelectDate: (date: Date) => void;
  onRangeChange: (value: number) => void;
  onJumpToToday: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-col gap-6 lg:h-full">
      <ActivityOverviewCard
        selectedYear={props.selectedYear}
        yearOptions={props.yearOptions}
        viewMode={props.viewMode}
        onViewModeChange={props.onViewModeChange}
        onYearChange={props.onYearChange}
        gridProps={{
          weeks: props.weeks,
          selectedYear: props.selectedYear,
          selectedDayKey: props.selectedDayKey,
          activityMap: props.activityMap,
          onSelectDate: props.onSelectDate,
        }}
        onJumpToToday={props.onJumpToToday}
        lineProps={{
          lineData: props.lineData,
          rangeDays: props.rangeDays,
          onRangeChange: props.onRangeChange,
          chartSize: props.chartSize,
          chartPaths: props.chartPaths,
          maxLineCount: props.maxLineCount,
          today: props.today,
        }}
        statusText={props.statusText}
      />

      <div className="min-h-[20rem] lg:flex-1 lg:min-h-0">
        <ActivityList
          selectedDate={props.selectedDate}
          items={props.dailyItems}
          loading={props.dailyLoading}
          error={props.dailyError}
        />
      </div>
    </div>
  );
}
