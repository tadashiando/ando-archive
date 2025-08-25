import { useUIStore } from "../stores/useUIStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import { useDocumentStore } from "../stores/useDocumentStore";
import { useEditorStore } from "../stores/useEditorStore";
import { useCategories } from "./queries/useCategories";
import { useDocuments } from "./queries/useDocuments";
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "./mutations/useCategoryMutations";
import {
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from "./mutations/useDocumentMutations";

/**
 * Composite hook for category management
 */
export const useCategoryManager = () => {
  const categoryStore = useCategoryStore();
  const uiStore = useUIStore();
  const categoriesQuery = useCategories();

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  return {
    // Store state
    ...categoryStore,

    // Query data
    categoriesData: categoriesQuery.data,
    categoriesLoading: categoriesQuery.isLoading,
    categoriesError: categoriesQuery.error,
    refetchCategories: categoriesQuery.refetch,

    // Mutations
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,

    // Mutation states
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,

    // UI helpers
    openSubcategoryModal: (parentCategory: any) => {
      categoryStore.setParentCategoryForSubcategory(parentCategory);
      uiStore.openModal("subcategory");
    },

    closeSubcategoryModal: () => {
      categoryStore.setParentCategoryForSubcategory(null);
      uiStore.closeModal("subcategory");
    },
  };
};

/**
 * Composite hook for document management
 */
export const useDocumentManager = () => {
  const documentStore = useDocumentStore();
  const categoryStore = useCategoryStore();
  const uiStore = useUIStore();
  const editorStore = useEditorStore();

  const documentsQuery = useDocuments(
    categoryStore.selectedCategory?.id || null
  );

  const createDocumentMutation = useCreateDocument();
  const updateDocumentMutation = useUpdateDocument();
  const deleteDocumentMutation = useDeleteDocument();

  return {
    // Store state
    ...documentStore,
    selectedCategory: categoryStore.selectedCategory,
    viewMode: uiStore.viewMode,

    // Query data
    documentsData: documentsQuery.data,
    documentsLoading: documentsQuery.isLoading,
    documentsError: documentsQuery.error,
    refetchDocuments: documentsQuery.refetch,

    // Mutations
    createDocument: createDocumentMutation.mutateAsync,
    updateDocument: updateDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync,

    // Mutation states
    isCreating: createDocumentMutation.isPending,
    isUpdating: updateDocumentMutation.isPending,
    isDeletingDoc: deleteDocumentMutation.isPending,

    // Editor integration
    hasUnsavedChanges: editorStore.hasUnsavedChanges,
    clearEditor: editorStore.clearEditor,

    // UI actions
    setViewMode: uiStore.setViewMode,
    openDeleteDialog: (document: any) => {
      documentStore.setDocumentToDelete(document);
      uiStore.openModal("deleteDocument");
    },

    closeDeleteDialog: () => {
      documentStore.setDocumentToDelete(null);
      uiStore.closeModal("deleteDocument");
    },
  };
};

/**
 * Composite hook for editor functionality
 */
export const useEditorManager = () => {
  const editorStore = useEditorStore();
  const documentStore = useDocumentStore();
  const categoryStore = useCategoryStore();
  const uiStore = useUIStore();

  const currentDocument = documentStore.editingDocumentId
    ? documentStore.getDocumentById(documentStore.editingDocumentId)
    : null;

  return {
    // Editor state
    ...editorStore,

    // Context
    selectedCategory: categoryStore.selectedCategory,
    editingDocumentId: documentStore.editingDocumentId,
    currentDocument,

    // Actions
    setEditingDocument: documentStore.setEditingDocument,
    setSelectedCategory: categoryStore.setSelectedCategory,
    setViewMode: uiStore.setViewMode,

    // Unsaved changes handling
    handleUnsavedChanges: (hasChanges: boolean) => {
      editorStore.setHasUnsavedChanges(hasChanges);

      if (hasChanges && categoryStore.pendingCategoryChange) {
        uiStore.openModal("unsavedChanges");
      }
    },

    // Navigation with unsaved changes check
    navigateWithUnsavedCheck: (navigationFn: () => void) => {
      if (editorStore.hasUnsavedChanges) {
        uiStore.openModal("unsavedChanges");
      } else {
        navigationFn();
      }
    },
  };
};

/**
 * Hook for modal management
 */
export const useModalManager = () => {
  const uiStore = useUIStore();

  return {
    modalStates: uiStore.modalStates,
    openModal: uiStore.openModal,
    closeModal: uiStore.closeModal,
    toggleModal: uiStore.toggleModal,
    closeAllModals: uiStore.closeAllModals,

    // Export context
    contextExportType: uiStore.contextExportType,
    contextExportId: uiStore.contextExportId,
    setExportContext: uiStore.setExportContext,
    clearExportContext: uiStore.clearExportContext,
  };
};

/**
 * Hook for sidebar management
 */
export const useSidebarManager = () => {
  const uiStore = useUIStore();
  const categoryStore = useCategoryStore();

  return {
    sidebarVisible: uiStore.sidebarVisible,
    sidebarCollapsed: uiStore.sidebarCollapsed,
    viewMode: uiStore.viewMode,

    setSidebarVisible: uiStore.setSidebarVisible,
    setSidebarCollapsed: uiStore.setSidebarCollapsed,
    toggleSidebar: uiStore.toggleSidebar,

    // Category context
    categories: categoryStore.categories,
    selectedCategory: categoryStore.selectedCategory,
    expandedCategories: categoryStore.expandedCategories,

    setSelectedCategory: categoryStore.setSelectedCategory,
    toggleCategoryExpansion: categoryStore.toggleCategoryExpansion,
  };
};
