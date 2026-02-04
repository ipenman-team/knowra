export type SidebarPrefs = {
  open: boolean;
  widthRem: number;
};

const PREFIX = 'contexta.sidebarPrefs.v1:';

export function getSidebarPrefsKey(userId: string): string {
  return `${PREFIX}${encodeURIComponent(userId)}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function readSidebarPrefs(userId: string): SidebarPrefs | null {
  if (typeof window === 'undefined') return null;
  if (!userId) return null;

  try {
    const raw = window.localStorage.getItem(getSidebarPrefsKey(userId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    const open = parsed.open;
    const widthRem = parsed.widthRem;

    if (typeof open !== 'boolean') return null;
    if (typeof widthRem !== 'number' || !Number.isFinite(widthRem) || widthRem <= 0) {
      return null;
    }

    return { open, widthRem };
  } catch {
    return null;
  }
}

export function writeSidebarPrefs(userId: string, prefs: SidebarPrefs): void {
  if (typeof window === 'undefined') return;
  if (!userId) return;
  try {
    window.localStorage.setItem(getSidebarPrefsKey(userId), JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function clearSidebarPrefs(userId: string): void {
  if (typeof window === 'undefined') return;
  if (!userId) return;
  try {
    window.localStorage.removeItem(getSidebarPrefsKey(userId));
  } catch {
    // ignore
  }
}

export function clearAllSidebarPrefs(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
