import {
  addDays,
  endOfWeek,
  endOfYear,
  format,
  startOfWeek,
  startOfYear,
} from 'date-fns';

export type ActivityItem = {
  id: string;
  type: string;
  content: string;
  time: string;
  dateKey: string;
};

const ACTIVITY_TYPES = ['创建', '编辑', '评论', '同步', '审核', '归档'];
const ACTIVITY_TARGETS = ['文档', '空间', '任务', '页面', '计划', '草稿'];
const ACTIVITY_ACTIONS = [
  '完成了',
  '更新了',
  '新增了',
  '调整了',
  '协作了',
  '回顾了',
];

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

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const getActivityCount = (date: Date) => {
  const seed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const rand = pseudoRandom(seed);
  if (rand < 0.45) return 0;
  if (rand < 0.65) return 1;
  if (rand < 0.8) return 2;
  if (rand < 0.9) return 3;
  if (rand < 0.96) return 4;
  return 5 + Math.floor(rand * 3);
};

export const getGreeting = (date: Date) => {
  const hour = date.getHours();
  if (hour < 12) return '上午好';
  if (hour < 18) return '中午好';
  return '晚上好';
};

export const getActivityLevel = (count: number) => {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 2) return 2;
  if (count <= 4) return 3;
  return 4;
};

export const getActivityItemsForDate = (date: Date): ActivityItem[] => {
  const count = getActivityCount(date);
  const dateKey = getDateKey(date);
  const seed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return Array.from({ length: count }, (_, index) => {
    const type = ACTIVITY_TYPES[(seed + index) % ACTIVITY_TYPES.length];
    const target =
      ACTIVITY_TARGETS[(seed + index * 2) % ACTIVITY_TARGETS.length];
    const action =
      ACTIVITY_ACTIONS[(seed + index * 3) % ACTIVITY_ACTIONS.length];
    const time = new Date(date);
    time.setHours(9 + ((seed + index * 5) % 9));
    time.setMinutes((seed * 7 + index * 11) % 60);
    time.setSeconds(0);
    return {
      id: `${dateKey}-${index}`,
      type,
      content: `${action}${target}「${target}#${(seed + index) % 20 + 1}」`,
      time: format(time, 'HH:mm'),
      dateKey,
    };
  });
};

export const buildYearGrid = (year: number, weekStartsOn = 1) => {
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
    const y =
      height - padding - (d.count / max) * (height - padding * 2);
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
