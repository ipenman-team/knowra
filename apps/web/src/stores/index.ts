// Page Selection Store
export {
  usePageSelectionStore,
  useSelectedPageId,
  useSelectedView,
  useIsPageSelected,
  type Selected,
} from './page-selection-store';

// Page Content Store
export {
  usePageContentStore,
  usePageMode,
  usePageTitle,
  useEditorValue,
  usePageSaveState,
} from './page-content-store';

// Page Store (page detail lifecycle)
export {
  usePageStore,
  useActivePage,
  useActivePageId,
  useActivePageLoading,
} from './page-store';

// Page Tree Store
export {
  usePageTreeStore,
  usePageTreeNodes,
  usePagesLoaded,
  useCreatingPage,
} from './page-tree-store';

// Pages Store
export {
  usePagesStore,
  usePages,
  usePagesLoadedBySpace,
  usePagesLoadingBySpace,
  useTreePages,
  useTreePagesLoaded,
  useTreePagesLoading,
  useTreePagesHasMore,
} from './pages-store';

// UI State Store
export {
  useUIStateStore,
  useIsNodeRenaming,
  useRenamingValue,
  useSavingRename,
  useNodeMenuState,
} from './ui-state-store';

// Sidebar UI Store (in-memory only)
export {
  useSidebarUiStore,
  useSidebarUiSnapshot,
  type SidebarUiSnapshot,
} from './sidebar-ui-store';

// Task Store
export { useTaskStore, useTasks, useTaskById } from './task-store';

// Me Store
export {
  useMeStore,
  useMeProfile,
  useMeVerification,
  useMeLoaded,
  useMeLoading,
  type MeProfile,
  type MeUser,
  type MeTenant,
  type MeMembership,
  type MeVerification,
} from './me-store';

// Space Store
export { useSpaceStore, useSpaces, useSpacesLoaded, useSpacesLoading, useCurrentSpaceId } from './space-store';

// Space Section Store (space sidebar -> main switch)
export { useSpaceSectionStore, useSpaceSection, type SpaceSectionId } from './space-section-store';
