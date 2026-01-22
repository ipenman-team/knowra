export function isValidE164(value: string) {
  return /^\+?[1-9]\d{6,14}$/.test(value.trim());
}

