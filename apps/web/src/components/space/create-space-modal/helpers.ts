import { EMAIL_PATTERN, IDENTIFIER_CHARS, IDENTIFIER_LENGTH } from './constants';

function generateIdentifier(length = IDENTIFIER_LENGTH): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    return Array.from(
      values,
      (value) => IDENTIFIER_CHARS[value % IDENTIFIER_CHARS.length],
    ).join('');
  }

  let result = '';
  for (let i = 0; i < length; i += 1) {
    result +=
      IDENTIFIER_CHARS[Math.floor(Math.random() * IDENTIFIER_CHARS.length)];
  }
  return result;
}

function parseEmails(input: string): { valid: string[]; invalid: string[] } {
  const values = input
    .split(/[\n,;]+/g)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => Boolean(item));

  const unique = [...new Set(values)];
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of unique) {
    if (EMAIL_PATTERN.test(email)) valid.push(email);
    else invalid.push(email);
  }

  return { valid, invalid };
}

export { generateIdentifier, parseEmails };
