export function pickActorId(userId: string | undefined | null) {
  const v = (userId ?? '').trim();
  return v || 'system';
}

