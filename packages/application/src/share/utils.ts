export function normalizeRequiredText(name: string, raw: unknown): string {
  if (typeof raw !== 'string') throw new Error(`${name} is required`);
  const v = raw.trim();
  if (!v) throw new Error(`${name} is required`);
  return v;
}

export function clampNumber(raw: unknown, min: number, max: number, fallback: number) {
  const n = Number(raw ?? fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), min), max);
}
