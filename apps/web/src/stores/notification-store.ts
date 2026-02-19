import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  syncUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: (count?: number) => void;
  resetUnread: () => void;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,

  syncUnreadCount: (count) => set({ unreadCount: clamp(count) }),

  incrementUnread: () =>
    set((state) => ({
      unreadCount: clamp(state.unreadCount + 1),
    })),

  decrementUnread: (count = 1) =>
    set((state) => ({
      unreadCount: clamp(state.unreadCount - clamp(count)),
    })),

  resetUnread: () => set({ unreadCount: 0 }),
}));

export const useNotificationUnreadCount = () =>
  useNotificationStore((s) => s.unreadCount);
