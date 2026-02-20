import {
  addDays,
  Day,
  endOfWeek,
  endOfYear,
  format,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import type { DailyCount } from '@knowra/shared';

export const ACTIVITY_LEVELS = [
  'bg-muted',
  'bg-blue-200',
  'bg-blue-300',
  'bg-blue-400',
  'bg-blue-500',
];

export const CHART_RANGES = [
  { labelKey: 'workbench.range30', value: 30 },
  { labelKey: 'workbench.range90', value: 90 },
  { labelKey: 'workbench.range180', value: 180 },
  { labelKey: 'workbench.range365', value: 365 },
];

export const getDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

export const getGreetingKey = (date: Date) => {
  const hour = date.getHours();
  if (hour < 6) return 'workbench.greeting.beforeDawn';
  if (hour < 9) return 'workbench.greeting.morning';
  if (hour < 12) return 'workbench.greeting.forenoon';
  if (hour < 14) return 'workbench.greeting.noon';
  if (hour < 18) return 'workbench.greeting.afternoon';
  return 'workbench.greeting.evening';
};

export const getActivityLevel = (count: number) => {
  if (count <= 0) return 0;
  if (count <= 10) return 1;
  if (count <= 20) return 2;
  if (count <= 40) return 3;
  return 4;
};

export const buildYearGrid = (year: number, weekStartsOn: Day = 1) => {
  const start = startOfWeek(startOfYear(new Date(year, 0, 1)), {
    weekStartsOn,
  });
  const end = endOfWeek(endOfYear(new Date(year, 0, 1)), { weekStartsOn });
  const days: Date[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    days.push(day);
  }
  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
};

export const buildDailyCountMap = (items: DailyCount[]) => {
  return new Map(items.map((item) => [item.date, item.count]));
};

export const buildDailySeries = (
  from: Date,
  to: Date,
  items: DailyCount[],
) => {
  const map = buildDailyCountMap(items);
  const series: { date: Date; count: number }[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const key = getDateKey(day);
    series.push({ date: day, count: map.get(key) ?? 0 });
  }
  return series;
};

export const buildLinePath = (
  data: { date: Date; count: number }[],
  width: number,
  height: number,
  padding: number,
) => {
  if (!data.length) return { linePath: '', areaPath: '' };
  const max = Math.max(1, ...data.map((d) => d.count));
  const span = data.length - 1 || 1;
  const points = data.map((d, index) => {
    const x = padding + (index / span) * (width - padding * 2);
    const y = height - padding - (d.count / max) * (height - padding * 2);
    return { x, y };
  });
  const linePath = points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    )
    .join(' ');
  const areaPath = `${linePath} L ${points.at(-1)?.x ?? 0} ${
    height - padding
  } L ${points[0]?.x ?? 0} ${height - padding} Z`;
  return { linePath, areaPath };
};
