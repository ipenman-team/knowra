export function encodeNotificationCursor(params: {
  createdAt: Date;
  id: string;
}): string {
  return `${params.createdAt.toISOString()}:${params.id}`;
}

export function decodeNotificationCursor(
  cursor: string,
): { createdAt: Date; id: string } | null {
  if (!cursor) return null;
  const idx = cursor.lastIndexOf(':');
  if (idx <= 0 || idx >= cursor.length - 1) return null;

  const rawTime = cursor.slice(0, idx);
  const rawId = cursor.slice(idx + 1);
  const createdAt = new Date(rawTime);
  if (!rawId.trim()) return null;
  if (Number.isNaN(createdAt.getTime())) return null;

  return { createdAt, id: rawId };
}
