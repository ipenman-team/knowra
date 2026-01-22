export function normalizeLowerTrim(value: string | undefined | null) {
  return (value ?? '').trim().toLowerCase();
}

export function normalizeTrim(value: string | undefined | null) {
  return (value ?? '').trim();
}

export function toDigits(value: string, maxLen: number) {
  return value.replace(/\D/g, '').slice(0, maxLen);
}

