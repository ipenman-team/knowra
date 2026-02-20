import { ActivityItem } from '@knowra/shared';
import { format } from 'date-fns';

export function mapActivityItems(
  items: ActivityItem[],
): (ActivityItem & { content: string; time: string })[] {
  return items.map((item) => {
    const time = formatActivityTime(item.createdAt);
    return {
      ...item,
      content: formatActivityContent(item),
      time,
    };
  });
}

export function formatActivityTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'HH:mm');
}

export function formatActivityContent(item: ActivityItem) {
  if (typeof item.content === 'string' && item.content.trim()) {
    return item.content.trim();
  }

  const metadata = item.metadata ?? {};
  const title =
    typeof metadata.title === 'string'
      ? metadata.title
      : typeof metadata.name === 'string'
        ? metadata.name
        : typeof (metadata as { filename?: unknown }).filename === 'string'
          ? (metadata as { filename: string }).filename
          : typeof (metadata as { fileName?: unknown }).fileName === 'string'
            ? (metadata as { fileName: string }).fileName
            : '';
  if (title) return title;
  return `${item.subjectType} ${item.subjectId}`;
}
