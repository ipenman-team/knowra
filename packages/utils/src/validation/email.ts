export function isValidEmail(value: string) {
  const v = value.trim();
  if (v.length < 3) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

