import {
  addDays,
  Day,
  endOfWeek,
  endOfYear,
  format,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import type { DailyCount } from '@contexta/shared';

export const ACTIVITY_LEVELS = [
  'bg-muted',
  'bg-blue-200',
  'bg-blue-300',
  'bg-blue-400',
  'bg-blue-500',
];

export const CHART_RANGES = [
  { label: '近 30 天', value: 30 },
  { label: '近 90 天', value: 90 },
  { label: '近 180 天', value: 180 },
  { label: '近 365 天', value: 365 },
];

export const getDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

export const getGreeting = (date: Date) => {
  const hour = date.getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
};

export const getActivityLevel = (count: number) => {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 2) return 2;
  if (count <= 4) return 3;
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
