import { create } from 'zustand';

export type MobileSidebarController = {
  id: string;
  label: string;
  isMobile: boolean;
  openMobile: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

interface MobileSidebarControllerState {
  controllers: Record<string, MobileSidebarController | undefined>;
  upsertController: (controller: MobileSidebarController) => void;
  removeController: (id: string) => void;
}

export const useMobileSidebarControllerStore =
  create<MobileSidebarControllerState>((set) => ({
    controllers: {},

    upsertController: (controller) =>
      set((state) => ({
        controllers: {
          ...state.controllers,
          [controller.id]: controller,
        },
      })),

    removeController: (id) =>
      set((state) => {
        if (!(id in state.controllers)) return state;
        const controllers = { ...state.controllers };
        delete controllers[id];
        return { controllers };
      }),
  }));

export const useMobileSidebarController = (id: string | undefined) =>
  useMobileSidebarControllerStore((s) => (id ? s.controllers[id] : undefined));
