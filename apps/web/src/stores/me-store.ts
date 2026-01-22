import { create } from 'zustand';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export type MeProfile = {
  nickname: string | null;
  avatarUrl: string | null;
};

export type MeUser = {
  id: string;
};

export type MeTenant = {
  id: string;
  type: string;
  key: string;
  name: string;
};

export type MeMembership = {
  role: string;
  tenant: MeTenant;
};

type MeSnapshot = {
  user: MeUser | null;
  profile: MeProfile | null;
  tenant: MeTenant | null;
  memberships: MeMembership[];
};

interface MeState extends MeSnapshot {
  loaded: boolean;
  loading: boolean;
  ensureLoaded: (options?: { force?: boolean }) => Promise<void>;
  invalidate: () => void;
  setProfile: (profile: MeProfile | null) => void;
}

const initialSnapshot: MeSnapshot = {
  user: null,
  profile: null,
  tenant: null,
  memberships: [],
};

let inflight: Promise<void> | null = null;

function normalizeProfile(input: unknown): MeProfile | null {
  if (!isRecord(input)) return null;

  const nicknameRaw = input.nickname;
  const avatarUrlRaw = input.avatarUrl;

  const nickname = typeof nicknameRaw === 'string' ? nicknameRaw.trim() : '';
  const avatarUrl = typeof avatarUrlRaw === 'string' ? avatarUrlRaw.trim() : '';

  return {
    nickname: nickname.length > 0 ? nickname : null,
    avatarUrl: avatarUrl.length > 0 ? avatarUrl : null,
  };
}

function normalizeUser(input: unknown): MeUser | null {
  if (!isRecord(input)) return null;
  const id = input.id;
  if (typeof id !== 'string' || id.trim().length === 0) return null;
  return { id: id.trim() };
}

function normalizeTenant(input: unknown): MeTenant | null {
  if (!isRecord(input)) return null;
  const id = input.id;
  const type = input.type;
  const key = input.key;
  const name = input.name;
  if (
    typeof id !== 'string' ||
    typeof type !== 'string' ||
    typeof key !== 'string' ||
    typeof name !== 'string'
  ) {
    return null;
  }
  const tid = id.trim();
  if (!tid) return null;
  return { id: tid, type, key, name };
}

function normalizeMemberships(input: unknown): MeMembership[] {
  if (!Array.isArray(input)) return [];
  const out: MeMembership[] = [];

  for (const item of input) {
    if (!isRecord(item)) continue;
    const role = item.role;
    const tenant = normalizeTenant(item.tenant);
    if (typeof role !== 'string' || !tenant) continue;
    out.push({ role, tenant });
  }

  return out;
}

export const useMeStore = create<MeState>((set, get) => ({
  ...initialSnapshot,
  loaded: false,
  loading: false,

  invalidate: () => set({ loaded: false }),

  setProfile: (profile) => set({ profile }),

  ensureLoaded: async (options) => {
    const force = Boolean(options?.force);
    const state = get();
    if (!force && state.loaded) return;
    if (!force && inflight) return inflight;

    inflight = (async () => {
      set({ loading: true });
      try {
        const res = await fetch('/api/auth/me', { method: 'GET' });
        if (res.status === 401) {
          const mod = await import('@/lib/api/client');
          await mod.handleUnauthorized();
          return;
        }
        if (!res.ok) return;

        const data = (await res.json().catch(() => null)) as unknown;
        if (!isRecord(data)) return;

        const user = normalizeUser(data.user);
        const profile = normalizeProfile(data.profile);
        const tenant = normalizeTenant(data.tenant);
        const memberships = normalizeMemberships(data.memberships);

        set({ user, profile, tenant, memberships, loaded: true });
      } finally {
        inflight = null;
        set({ loading: false });
      }
    })();

    return inflight;
  },
}));

export const useMeProfile = () => useMeStore((s) => s.profile);
export const useMeLoaded = () => useMeStore((s) => s.loaded);
export const useMeLoading = () => useMeStore((s) => s.loading);
