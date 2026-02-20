import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function hasAbortName(e: unknown): e is { name: string } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'name' in e &&
    typeof (e as { name: unknown }).name === 'string'
  );
}

export function formatZhDate(d: Date): string {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  return format(d, 'M/d EEE', { locale: zhCN });
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'] as const;
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const nf = new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  });
  return `${nf.format(size)} ${units[unitIndex]}`;
}
