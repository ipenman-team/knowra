export function normalizeRequiredText(name: string, value: unknown): string {
  if (typeof value !== 'string') throw new Error(`${name} is required`);
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} is required`);
  return normalized;
}

export function clampLimit(raw: unknown, defaults = 20, max = 100): number {
  const n = Number(raw ?? defaults);
  if (!Number.isFinite(n)) return defaults;
  const int = Math.floor(n);
  if (int < 1) return 1;
  if (int > max) return max;
  return int;
}

export function toContentText(input: unknown): string {
  if (typeof input === 'string') {
    const normalized = input.trim();
    if (!normalized) throw new Error('content is required');
    return normalized;
  }

  if (input && typeof input === 'object') {
    const rawText = (input as { text?: unknown }).text;
    if (typeof rawText === 'string') {
      const normalized = rawText.trim();
      if (!normalized) throw new Error('content is required');
      return normalized;
    }
  }

  throw new Error('content is required');
}
