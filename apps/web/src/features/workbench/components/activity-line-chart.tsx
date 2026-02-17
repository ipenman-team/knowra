import { useMemo } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CHART_RANGES } from './activity-data';
import { useI18n } from '@/lib/i18n/provider';

type ActivityLineChartProps = {
  lineData: { date: Date; count: number }[];
  rangeDays: number;
  onRangeChange: (value: number) => void;
  chartSize: { width: number; height: number; padding: number };
  chartPaths: { linePath: string; areaPath: string };
  maxLineCount: number;
  today: Date;
};

export function ActivityLineChart({
  lineData,
  rangeDays,
  onRangeChange,
  chartSize,
  chartPaths,
  maxLineCount,
  today,
}: ActivityLineChartProps) {
  const { t, locale } = useI18n();
  const startDate = lineData[0]?.date ?? today;
  const endDate = lineData.at(-1)?.date ?? today;
  const span = lineData.length - 1 || 1;
  const monthDayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
      }),
    [locale],
  );
  const startLabel = monthDayFormatter.format(startDate);
  const endLabel = monthDayFormatter.format(endDate);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {t('workbench.timeRange')}: {startLabel}-{endLabel}
        </div>
        <Select
          value={String(rangeDays)}
          onValueChange={(value) => onRangeChange(Number(value))}
        >
          <SelectTrigger className="h-9 w-[120px]">
            <SelectValue placeholder={t('workbench.selectRange')} />
          </SelectTrigger>
          <SelectContent>
            {CHART_RANGES.map((range) => (
              <SelectItem key={range.value} value={String(range.value)}>
                {t(range.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border bg-muted/20 p-4">
        <svg
          viewBox={`0 0 ${chartSize.width} ${chartSize.height}`}
          className="h-[220px] w-full"
          role="img"
          aria-label={t('workbench.lineChartAria')}
        >
          <line
            x1={chartSize.padding}
            y1={chartSize.height - chartSize.padding}
            x2={chartSize.width - chartSize.padding}
            y2={chartSize.height - chartSize.padding}
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
          <line
            x1={chartSize.padding}
            y1={chartSize.padding}
            x2={chartSize.padding}
            y2={chartSize.height - chartSize.padding}
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
          <path
            d={chartPaths.areaPath}
            fill="hsl(var(--primary) / 0.15)"
            stroke="none"
          />
          <path
            d={chartPaths.linePath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
          {lineData.map((point, index) => {
            const x =
              chartSize.padding +
              (index / span) * (chartSize.width - chartSize.padding * 2);
            const y =
              chartSize.height -
              chartSize.padding -
              (point.count / maxLineCount) *
                (chartSize.height - chartSize.padding * 2);
            return (
              <circle
                key={point.date.toISOString()}
                cx={x}
                cy={y}
                r="3"
                fill="hsl(var(--primary))"
              />
            );
          })}
        </svg>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{startLabel}</span>
          <span>
            {t('workbench.peak')} {maxLineCount} {t('workbench.times')}
          </span>
          <span>{endLabel}</span>
        </div>
      </div>
    </div>
  );
}
