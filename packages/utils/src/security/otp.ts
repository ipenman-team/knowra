export function generateNumericCode(length: number) {
  const len = Number.isFinite(length) ? Math.max(1, Math.floor(length)) : 6;
  const max = 10 ** len;
  return String(Math.floor(Math.random() * max)).padStart(len, '0');
}

