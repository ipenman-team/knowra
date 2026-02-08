export function normalizeRequiredText(name: string, raw: unknown): string {
  if (typeof raw !== 'string') throw new Error(`${name} is required`);
  const v = raw.trim();
  if (!v) throw new Error(`${name} is required`);
  return v;
}

export function formatLocalDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function endOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function safeOneLineText(raw: string, maxLen = 140): string {
  const v = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!v) return '';
  return v.length > maxLen ? v.slice(0, maxLen).trimEnd() : v;
}
