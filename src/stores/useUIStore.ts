import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LayoutMode } from "../components/UI/LayoutToggle";

interface ModalStates {
  newCategory: boolean;
  subcategory: boolean;
  categoryManagement: boolean;
  categorySelect: boolean;
  export: boolean;
  import: boolean;
  unsavedChanges: boolean;
  deleteDocument: boolean;
}

interface UIStore {
  // Persistent view state
  viewMode: "list" | "editor" | "viewer";
  layoutMode: LayoutMode;
  sidebarVisible: boolean;
  sidebarCollapsed: boolean;

  // Modal states (not persistent)
  modalStates: ModalStates;

  // Context for exports
  contextExportType: "category" | "document" | null;
  contextExportId: number | null;

  // Actions
  setViewMode: (mode: "list" | "editor" | "viewer") => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setSidebarVisible: (visible: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Modal management
  openModal: (modal: keyof ModalStates) => void;
  closeModal: (modal: keyof ModalStates) => void;
  toggleModal: (modal: keyof ModalStates, open?: boolean) => void;
  closeAllModals: () => void;

  // Export context
  setExportContext: (
    type: "category" | "document" | null,
    id: number | null
  ) => void;
  clearExportContext: () => void;
}

const initialModalStates: ModalStates = {
  newCategory: false,
  subcategory: false,
  categoryManagement: false,
  categorySelect: false,
  export: false,
  import: false,
  unsavedChanges: false,
  deleteDocument: false,
};

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial persistent state
      viewMode: "list",
      layoutMode: "compact",
      sidebarVisible: true,
      sidebarCollapsed: false,

      // Non-persistent state
      modalStates: { ...initialModalStates },
      contextExportType: null,
      contextExportId: null,

      // View mode actions
      setViewMode: (mode) => set({ viewMode: mode }),
      setLayoutMode: (mode) => set({ layoutMode: mode }),
      setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleSidebar: () => {
        const { sidebarVisible } = get();
        set({ sidebarVisible: !sidebarVisible });
      },

      // Modal actions
      openModal: (modal) =>
        set((state) => ({
          modalStates: { ...state.modalStates, [modal]: true },
        })),

      closeModal: (modal) =>
        set((state) => ({
          modalStates: { ...state.modalStates, [modal]: false },
        })),

      toggleModal: (modal, open) =>
        set((state) => ({
          modalStates: {
            ...state.modalStates,
            [modal]: open !== undefined ? open : !state.modalStates[modal],
          },
        })),

      closeAllModals: () => set({ modalStates: { ...initialModalStates } }),

      // Export context actions
      setExportContext: (type, id) =>
        set({ contextExportType: type, contextExportId: id }),

      clearExportContext: () =>
        set({ contextExportType: null, contextExportId: null }),
    }),
    {
      name: "ando-archive-ui-store",
      // Only persist UI preferences, not modal states
      partialize: (state) => ({
        viewMode: state.viewMode,
        layoutMode: state.layoutMode,
        sidebarVisible: state.sidebarVisible,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Computed values hooks
export const useEffectiveSidebarCollapsed = () => {
  return useUIStore((state) => {
    const shouldCollapse =
      state.viewMode === "editor" || state.viewMode === "viewer";
    return shouldCollapse ? true : state.sidebarCollapsed;
  });
};
