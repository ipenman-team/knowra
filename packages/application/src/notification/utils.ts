export function normalizeRequiredText(name: string, raw: unknown): string {
  if (typeof raw !== 'string') throw new Error(`${name} is required`);
  const value = raw.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function normalizeOptionalText(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return value ? value : null;
}

export function normalizeBoolean(raw: unknown, fallback = false): boolean {
  if (typeof raw === 'boolean') return raw;
  return fallback;
}

export function normalizeNotificationType(raw: unknown): string {
  return normalizeRequiredText('type', raw).toUpperCase();
}

export function normalizeLimit(raw: unknown, fallback: number): number {
  const n = Number(raw ?? fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), 1), 50);
}

export function assertMaxLength(
  name: string,
  value: string,
  maxLength: number,
): void {
  if (value.length > maxLength) {
    throw new Error(`${name} must be <= ${maxLength} chars`);
  }
}

export function normalizeLink(raw: unknown): string | null {
  const value = normalizeOptionalText(raw);
  if (!value) return null;

  if (!value.startsWith('/')) {
    throw new Error('link must start with "/"');
  }

  if (value.startsWith('//')) {
    throw new Error('link must be relative path');
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) {
    throw new Error('link must be relative path');
  }

  return value;
}

export function normalizeReceiverIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) throw new Error('receiverIds must be array');

  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'string') throw new Error('receiverIds must be string[]');
    const value = item.trim();
    if (!value) continue;
    seen.add(value);
  }

  const receiverIds = [...seen];
  if (receiverIds.length === 0) {
    throw new Error('receiverIds is required');
  }
  if (receiverIds.length > 100) {
    throw new Error('receiverIds size must be <= 100');
  }

  return receiverIds;
}

export function normalizeRequestId(raw: unknown): string | null {
  const value = normalizeOptionalText(raw);
  if (!value) return null;
  assertMaxLength('requestId', value, 120);
  return value;
}

export function normalizeMetadata(raw: unknown): Record<string, unknown> | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('metadata must be object');
  }
  return raw as Record<string, unknown>;
}
