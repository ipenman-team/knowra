import { apiClient } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/api/client';
import { create } from 'zustand';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export type MeProfile = {
  nickname: string | null;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
};

export type MeUser = {
  id: string;
};

export type MeTenant = {
  id: string;
  type: string;
  key: string | null;
  name: string;
};

export type MeMembership = {
  role: string;
  tenant: MeTenant;
};

export type MeVerification = {
  email: {
    bound: boolean;
    verified: boolean;
    identifier: string | null;
  };
  phone: {
    bound: boolean;
    verified: boolean;
    identifier: string | null;
  };
  password: {
    set: boolean;
  };
};

type MeSnapshot = {
  user: MeUser | null;
  profile: MeProfile | null;
  tenant: MeTenant | null;
  memberships: MeMembership[];
  verification: MeVerification | null;
};

interface MeState extends MeSnapshot {
  loaded: boolean;
  loading: boolean;
  ensureLoaded: (options?: { force?: boolean }) => Promise<void>;
  invalidate: () => void;
  setProfile: (profile: MeProfile | null) => void;
  updateProfile: (input: {
    nickname?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
  }) => Promise<{ ok: true; profile: MeProfile | null } | { ok: false; message: string }>;
}

const initialSnapshot: MeSnapshot = {
  user: null,
  profile: null,
  tenant: null,
  memberships: [],
  verification: null,
};

let inflight: Promise<void> | null = null;

function normalizeProfile(input: unknown): MeProfile | null {
  if (!isRecord(input)) return null;

  const nicknameRaw = input.nickname;
  const avatarUrlRaw = input.avatarUrl;
  const bioRaw = input.bio;
  const phoneRaw = input.phone;

  const nickname = typeof nicknameRaw === 'string' ? nicknameRaw.trim() : '';
  const avatarUrl = typeof avatarUrlRaw === 'string' ? avatarUrlRaw.trim() : '';
  const bio = typeof bioRaw === 'string' ? bioRaw.trim() : '';
  const phone = typeof phoneRaw === 'string' ? phoneRaw.trim() : '';

  return {
    nickname: nickname.length > 0 ? nickname : null,
    avatarUrl: avatarUrl.length > 0 ? avatarUrl : null,
    bio: bio.length > 0 ? bio : null,
    phone: phone.length > 0 ? phone : null,
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
  if (typeof id !== 'string' || typeof type !== 'string' || typeof name !== 'string') {
    return null;
  }
  const tid = id.trim();
  if (!tid) return null;
  const k = typeof key === 'string' ? (key.trim().length > 0 ? key : null) : null;
  return { id: tid, type, key: k, name };
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

function normalizeVerification(input: unknown): MeVerification | null {
  if (!isRecord(input)) return null;
  const emailRaw = input.email;
  const phoneRaw = input.phone;
  const passwordRaw = input.password;

  if (!isRecord(emailRaw) || !isRecord(phoneRaw) || !isRecord(passwordRaw)) {
    return null;
  }

  const normalizeIdentity = (raw: Record<string, unknown>) => {
    const bound = raw.bound === true;
    const verified = raw.verified === true;
    const identifier = typeof raw.identifier === 'string' ? raw.identifier.trim() : '';
    return {
      bound,
      verified,
      identifier: identifier.length > 0 ? identifier : null,
    };
  };

  const email = normalizeIdentity(emailRaw);
  const phone = normalizeIdentity(phoneRaw);
  const passwordSet = passwordRaw.set === true;

  return {
    email,
    phone,
    password: { set: passwordSet },
  };
}

export const useMeStore = create<MeState>((set, get) => ({
  ...initialSnapshot,
  loaded: false,
  loading: false,

  invalidate: () => set({ loaded: false }),

  setProfile: (profile) => set({ profile }),

  updateProfile: async (input) => {
    const payload: Record<string, unknown> = {};
    if ('nickname' in input) payload.nickname = input.nickname;
    if ('avatarUrl' in input) payload.avatarUrl = input.avatarUrl;
    if ('bio' in input) payload.bio = input.bio;

    const res = await apiClient.put('/users/profile', payload);

    if (res.status === 401) {
      const mod = await import('@/lib/api/client');
      await mod.handleUnauthorized();
      return { ok: false, message: 'unauthorized' };
    }

    const data = res.data;
    if (!data.ok) {
      return { ok: false, message: res.data.message || '请求失败' };
    }

    const nextProfile = isRecord(data) ? normalizeProfile(data.profile) : null;
    set({ profile: nextProfile });
    return { ok: true, profile: nextProfile };
  },

  ensureLoaded: async (options) => {
    const force = Boolean(options?.force);
    const state = get();
    if (!force && state.loaded) return;
    if (!force && inflight) return inflight;

    inflight = (async () => {
      set({ loading: true });
      try {
        console.log('[me-store] fetching /users/me, api base:', getApiBaseUrl?.() ?? 'unknown');
        const res = await apiClient.get('/users/me');
        console.log('[me-store] /users/me res:', res.status, res.data);
        if (res.status === 401) {
          const mod = await import('@/lib/api/client');
          await mod.handleUnauthorized();
          return;
        }
        if (!res.data.ok) return;

        const data = res.data;
        if (!isRecord(data)) return;

        const user = normalizeUser(data.user);
        const profile = normalizeProfile(data.profile);
        const tenant = normalizeTenant(data.tenant);
        const memberships = normalizeMemberships(data.memberships);
        const verification = normalizeVerification(data.verification);

        set({ user, profile, tenant, memberships, verification, loaded: true });
      } finally {
        inflight = null;
        set({ loading: false });
      }
    })();

    return inflight;
  },
}));

export const useMeProfile = () => useMeStore((s) => s.profile);
export const useMeVerification = () => useMeStore((s) => s.verification);
export const useMeLoaded = () => useMeStore((s) => s.loaded);
export const useMeLoading = () => useMeStore((s) => s.loading);
