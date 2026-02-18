function encodeCursor(payload: { ts: string; id: string }): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeCursor(
  cursor: string,
): { ts: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const data = JSON.parse(raw) as { ts?: unknown; id?: unknown };
    if (typeof data.ts !== 'string' || typeof data.id !== 'string') return null;
    return { ts: data.ts, id: data.id };
  } catch {
    return null;
  }
}

export function encodeCommentThreadCursor(input: {
  lastMessageAt: Date;
  id: string;
}): string {
  return encodeCursor({ ts: input.lastMessageAt.toISOString(), id: input.id });
}

export function decodeCommentThreadCursor(
  cursor: string,
): { lastMessageAt: Date; id: string } | null {
  const decoded = decodeCursor(cursor);
  if (!decoded) return null;
  const at = new Date(decoded.ts);
  if (!Number.isFinite(at.getTime())) return null;
  return {
    lastMessageAt: at,
    id: decoded.id,
  };
}

export function encodeCommentMessageCursor(input: {
  createdAt: Date;
  id: string;
}): string {
  return encodeCursor({ ts: input.createdAt.toISOString(), id: input.id });
}

export function decodeCommentMessageCursor(
  cursor: string,
): { createdAt: Date; id: string } | null {
  const decoded = decodeCursor(cursor);
  if (!decoded) return null;
  const at = new Date(decoded.ts);
  if (!Number.isFinite(at.getTime())) return null;
  return {
    createdAt: at,
    id: decoded.id,
  };
}
