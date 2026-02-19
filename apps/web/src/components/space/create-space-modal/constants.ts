const IDENTIFIER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const IDENTIFIER_LENGTH = 8;

const SPACE_COLORS = [
  { label: 'lime', value: '#a3e635' },
  { label: 'green', value: '#4ade80' },
  { label: 'yellow', value: '#eab308' },
  { label: 'amber', value: '#f59e0b' },
  { label: 'orange', value: '#f97316' },
  { label: 'red', value: '#ef4444' },
  { label: 'sky', value: '#0ea5e9' },
  { label: 'blue', value: '#60a5fa' },
  { label: 'indigo', value: '#6366f1' },
  { label: 'violet', value: '#8b5cf6' },
  { label: 'purple', value: '#a855f7' },
  { label: 'pink', value: '#ec4899' },
  { label: 'rose', value: '#f43f5e' },
  { label: 'gray', value: '#6b7280' },
  { label: 'neutral', value: '#000000' },
];

const DEFAULT_COLOR =
  SPACE_COLORS.find((x) => x.label === 'blue')?.value ?? '#60a5fa';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export {
  IDENTIFIER_CHARS,
  IDENTIFIER_LENGTH,
  SPACE_COLORS,
  DEFAULT_COLOR,
  EMAIL_PATTERN,
};
