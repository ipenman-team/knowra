import { create } from 'zustand';

export type SpaceSectionId = 'pages' | 'directory';

interface SpaceSectionState {
  section: SpaceSectionId;
  setSection: (section: SpaceSectionId) => void;
}

export const useSpaceSectionStore = create<SpaceSectionState>((set) => ({
  section: 'pages',
  setSection: (section) => set({ section }),
}));

export const useSpaceSection = () => useSpaceSectionStore((s) => s.section);
