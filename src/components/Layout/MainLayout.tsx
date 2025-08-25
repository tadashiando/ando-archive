import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Category } from "../../database";
import { Spinner, CreateDocumentCard, Dialog } from "../UI";
import {
  NewCategoryModal,
  CategorySelectModal,
  CategoryManagementModal,
  SubcategoryModal,
} from "../Category";
import { UnsavedChangesModal } from "../UI";
import DocumentEditor from "../Documents/Editor/DocumentEditor";
import DocumentViewer from "../Documents/Viewer/DocumentViewer";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useMenuEvents } from "../../hooks/useMenuEvents";
import { getCategoryIcon } from "../../utils/categoryIcons";
import ExportDialog from "../Export/ExportDialog";
import ImportDialog from "../Import/ImportDialog";
import DocumentListView from "../Documents/DocumentListView";
import LayoutToggle from "../UI/LayoutToggle";
import CompactDocumentRow from "../Documents/CompactDocumentRow";
import CategoryBreadcrumb from "../Category/CategoryBreadcrumb";

// Import stores and hooks
import {
  useUIStore,
  useEffectiveSidebarCollapsed,
} from "../../stores/useUIStore";
import { useCategoryStore } from "../../stores/useCategoryStore";
import { useDocumentStore } from "../../stores/useDocumentStore";
import { useEditorStore } from "../../stores/useEditorStore";

// Import query hooks
import { useCategories } from "../../hooks/queries/useCategories";
import { useDocuments } from "../../hooks/queries/useDocuments";

// Import mutation hooks
import { useCreateCategory } from "../../hooks/mutations/useCategoryMutations";
import {
  useCreateDocument,
  useDeleteDocument,
} from "../../hooks/mutations/useDocumentMutations";

const MainLayout: React.FC = () => {
  const { t } = useTranslation();

  // Store states
  const {
    viewMode,
    layoutMode,
    sidebarVisible,
    modalStates,
    contextExportType,
    contextExportId,
    setViewMode,
    setLayoutMode,
    setSidebarVisible,
    openModal,
    closeModal,
    setExportContext,
    clearExportContext,
  } = useUIStore();

  const {
    categories,
    selectedCategory,
    categoryPath,
    parentCategoryForSubcategory,
    pendingCategoryChange,
    setCategories,
    setSelectedCategory,
    setCategoryPath,
    setParentCategoryForSubcategory,
    setPendingCategoryChange,
    clearPendingCategoryChange,
    findCategoryById,
    getAllCategoryNames,
  } = useCategoryStore();

  const {
    documents,
    selectedDocumentId,
    editingDocumentId,
    searchQuery,
    documentToDelete,
    isDeleting,
    setDocuments,
    setSelectedDocument,
    setEditingDocument,
    setSearchQuery,
    setDocumentToDelete,
    setIsDeleting,
    getFilteredDocuments,
  } = useDocumentStore();

  const { hasUnsavedChanges, setHasUnsavedChanges, clearEditor } =
    useEditorStore();

  // Computed values
  const effectiveSidebarCollapsed = useEffectiveSidebarCollapsed();
  const shouldSidebarCollapse = viewMode === "editor" || viewMode === "viewer";

  // Query hooks
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories();

  const {
    data: documentsData,
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments,
  } = useDocuments(selectedCategory?.id || null);

  // Mutation hooks
  const createCategoryMutation = useCreateCategory();
  const createDocumentMutation = useCreateDocument();
  const deleteDocumentMutation = useDeleteDocument();

  // Sync query data with stores
  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData);
    }
  }, [categoriesData, setCategories]);

  useEffect(() => {
    if (documentsData) {
      setDocuments(documentsData);
    }
  }, [documentsData, setDocuments]);

  // Menu event handlers
  useMenuEvents({
    onNewDocument: handleNewDocument,
    onNewCategory: () => openModal("newCategory"),
    onManageCategories: () => openModal("categoryManagement"),
    onExport: () => openModal("export"),
    onImport: () => openModal("import"),
    onToggleSidebar: () => setSidebarVisible(!sidebarVisible),
    onChangeCategory: (category: Category) => {
      if (hasUnsavedChanges) {
        setPendingCategoryChange(category);
        openModal("unsavedChanges");
      } else {
        const foundCategory = findCategoryById(category.id);
        if (foundCategory) {
          setSelectedCategory(foundCategory);
          setViewMode("list");
          setEditingDocument(null);
          setSelectedDocument(null);
          setHasUnsavedChanges(false);
        }
      }
    },
  });

  // Event Handlers
  function handleNewDocument(category?: Category) {
    if (category) {
      const foundCategory = findCategoryById(category.id);
      if (foundCategory) {
        setSelectedCategory(foundCategory);
        setViewMode("editor");
        setEditingDocument(null);
        setHasUnsavedChanges(false);
      }
    } else {
      openModal("categorySelect");
    }
  }

  const handleCategorySelected = (category: Category) => {
    const foundCategory = findCategoryById(category.id);
    if (foundCategory) {
      setSelectedCategory(foundCategory);
      setViewMode("editor");
      setEditingDocument(null);
      setHasUnsavedChanges(false);
    }
  };

  const handleViewDocument = (documentId: number) => {
    setSelectedDocument(documentId);
    setViewMode("viewer");
  };

  const handleEditDocument = (documentId: number) => {
    setEditingDocument(documentId);
    setViewMode("editor");
    setHasUnsavedChanges(false);
  };

  const handleDocumentCreated = () => {
    // TanStack Query will automatically refetch and update the data
    setViewMode("list");
    setEditingDocument(null);
    setHasUnsavedChanges(false);
  };

  // Delete operations
  const handleDeleteDocument = (documentId: number) => {
    const document = documents.find((doc) => doc.id === documentId);
    if (document) {
      setDocumentToDelete(document);
      openModal("deleteDocument");
    }
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDocumentMutation.mutateAsync(documentToDelete.id);
      closeModal("deleteDocument");
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Category management handlers
  const handleCreateCategory = async (
    name: string,
    icon: string,
    color: string
  ) => {
    try {
      await createCategoryMutation.mutateAsync({ name, icon, color });
      console.log("Category created successfully");
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  };

  const handleCategoryManagementUpdate = () => {
    const currentCategoryId = selectedCategory?.id;

    // TanStack Query will automatically refetch categories
    refetchCategories().then(() => {
      if (currentCategoryId) {
        const categoryStillExists = findCategoryById(currentCategoryId);

        if (!categoryStillExists) {
          setDocuments([]);
          setSelectedCategory(categories.length > 0 ? categories[0] : null);

          if (viewMode !== "list") {
            setViewMode("list");
            setEditingDocument(null);
            setSelectedDocument(null);
            setHasUnsavedChanges(false);
          }
        }
      }
    });
  };

  // Subcategory handlers
  const handleOpenSubcategoryModal = (parentCategory: Category) => {
    const foundCategory = findCategoryById(parentCategory.id);
    if (foundCategory) {
      setParentCategoryForSubcategory(foundCategory);
      openModal("subcategory");
    }
  };

  const handleCloseSubcategoryModal = () => {
    closeModal("subcategory");
    setParentCategoryForSubcategory(null);
  };

  const handleSubcategoryCreated = async (
    name: string,
    icon: string,
    color: string,
    description?: string
  ) => {
    if (!parentCategoryForSubcategory) return;

    try {
      await createCategoryMutation.mutateAsync({
        name,
        icon,
        color,
        parent_id: parentCategoryForSubcategory.id,
        description,
      });
      handleCloseSubcategoryModal();
    } catch (error) {
      console.error("Error creating subcategory:", error);
      throw error;
    }
  };

  // Unsaved changes dialog handlers
  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false);
    closeModal("unsavedChanges");
    setViewMode("list");
    setEditingDocument(null);
    if (pendingCategoryChange) {
      const foundCategory = findCategoryById(pendingCategoryChange.id);
      if (foundCategory) {
        setSelectedCategory(foundCategory);
      }
      clearPendingCategoryChange();
    }
  };

  const handleSaveAndContinue = async () => {
    // TODO: Trigger save in editor component
    setHasUnsavedChanges(false);
    closeModal("unsavedChanges");
    setViewMode("list");
    setEditingDocument(null);
    if (pendingCategoryChange) {
      const foundCategory = findCategoryById(pendingCategoryChange.id);
      if (foundCategory) {
        setSelectedCategory(foundCategory);
      }
      clearPendingCategoryChange();
    }
  };

  const handleCancelUnsavedChanges = () => {
    closeModal("unsavedChanges");
    clearPendingCategoryChange();
  };

  const handleExportCategory = (categoryId: number) => {
    setExportContext("category", categoryId);
    openModal("export");
  };

  const handleExportDocument = (documentId: number) => {
    setExportContext("document", documentId);
    openModal("export");
  };

  const handleImportComplete = () => {
    // Refresh all data after successful import
    refetchCategories();
    if (selectedCategory) {
      refetchDocuments();
    }
  };

  const handleCloseExportDialog = () => {
    closeModal("export");
    clearExportContext();
  };

  // Loading and error states
  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading categories</p>
          <button
            onClick={() => refetchCategories()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredDocuments = getFilteredDocuments();

  return (
    <div className="h-screen flex flex-col sage-bg-dark">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewDocument={handleNewDocument}
        onNewCategory={() => openModal("newCategory")}
        onManageCategories={() => openModal("categoryManagement")}
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={(category) => {
            if (hasUnsavedChanges) {
              setPendingCategoryChange(category);
              openModal("unsavedChanges");
            } else {
              setSelectedCategory(category);
            }
          }}
          onAddSubcategory={handleOpenSubcategoryModal}
          visible={sidebarVisible}
          collapsed={effectiveSidebarCollapsed}
        />

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col transition-all duration-200 ${
            sidebarVisible
              ? effectiveSidebarCollapsed
                ? "ml-16"
                : "ml-80"
              : "ml-0"
          }`}
        >
          {viewMode === "list" && (
            <main className="flex-1 overflow-auto">
              {selectedCategory && (
                <div className="sticky top-0 z-10 sage-bg-medium border-b sage-border p-4">
                  <div className="flex items-center justify-between">
                    <CategoryBreadcrumb
                      category={selectedCategory}
                      path={categoryPath}
                      onNavigate={(cat) => {
                        const foundCategory = findCategoryById(cat.id);
                        if (foundCategory) {
                          setSelectedCategory(foundCategory);
                        }
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <LayoutToggle
                        mode={layoutMode}
                        onChange={setLayoutMode}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6">
                {selectedCategory ? (
                  <>
                    {documentsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Spinner size="md" />
                      </div>
                    ) : filteredDocuments.length === 0 && !searchQuery ? (
                      <div className="text-center py-12">
                        <div className="sage-text-mist mb-4">
                          {t("documents.emptyCategory")}
                        </div>
                        <CreateDocumentCard
                          onClick={() => setViewMode("editor")}
                          categoryIcon={selectedCategory.icon}
                          categoryColor={selectedCategory.color}
                        />
                      </div>
                    ) : layoutMode === "compact" ? (
                      <div className="space-y-2">
                        {!editingDocumentId && !selectedDocumentId && (
                          <CreateDocumentCard
                            onClick={() => setViewMode("editor")}
                            categoryIcon={selectedCategory.icon}
                            categoryColor={selectedCategory.color}
                            compact
                          />
                        )}
                        {filteredDocuments.map((doc) => (
                          <CompactDocumentRow
                            key={doc.id}
                            document={doc}
                            categoryIcon={selectedCategory.icon}
                            categoryColor={selectedCategory.color}
                            onView={() => handleViewDocument(doc.id)}
                            onEdit={() => handleEditDocument(doc.id)}
                            onDelete={() => handleDeleteDocument(doc.id)}
                            onExport={() => handleExportDocument(doc.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <DocumentListView
                        documents={filteredDocuments}
                        selectedCategory={selectedCategory}
                        onView={handleViewDocument}
                        onEdit={handleEditDocument}
                        onDelete={handleDeleteDocument}
                        onExport={handleExportDocument}
                        onCreate={() => setViewMode("editor")}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 sage-text-mist">
                        {getCategoryIcon("folder")}
                      </div>
                      <h3 className="text-lg font-medium sage-text-cream mb-2">
                        {t("documents.selectCategory")}
                      </h3>
                      <p className="sage-text-mist mb-6">
                        {t("documents.selectCategoryDescription")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </main>
          )}

          {viewMode === "editor" && (
            <DocumentEditor
              selectedCategory={selectedCategory}
              editingDocumentId={editingDocumentId}
              onBack={() => setViewMode("list")}
              onDocumentCreated={handleDocumentCreated}
              onUnsavedChanges={setHasUnsavedChanges}
            />
          )}

          {viewMode === "viewer" && selectedDocumentId && (
            <DocumentViewer
              documentId={selectedDocumentId}
              onBack={() => setViewMode("list")}
              onEdit={() => handleEditDocument(selectedDocumentId)}
              onDelete={() => handleDeleteDocument(selectedDocumentId)}
              onExport={() => handleExportDocument(selectedDocumentId)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <CategorySelectModal
        isOpen={modalStates.categorySelect}
        onClose={() => closeModal("categorySelect")}
        onCategorySelect={handleCategorySelected}
        categories={categories}
      />

      <NewCategoryModal
        isOpen={modalStates.newCategory}
        onClose={() => closeModal("newCategory")}
        onCategoryCreate={handleCreateCategory}
        existingCategories={getAllCategoryNames()}
      />

      <SubcategoryModal
        isOpen={modalStates.subcategory}
        onClose={handleCloseSubcategoryModal}
        parentCategory={parentCategoryForSubcategory}
        onSubcategoryCreate={handleSubcategoryCreated}
        existingNames={getAllCategoryNames()}
      />

      <CategoryManagementModal
        isOpen={modalStates.categoryManagement}
        onClose={() => closeModal("categoryManagement")}
        categories={categories}
        onCategoryUpdate={handleCategoryManagementUpdate}
        onNewCategory={() => {
          closeModal("categoryManagement");
          openModal("newCategory");
        }}
      />

      <UnsavedChangesModal
        isOpen={modalStates.unsavedChanges}
        onClose={handleCancelUnsavedChanges}
        onDiscard={handleDiscardChanges}
        onSave={handleSaveAndContinue}
        isLoading={false}
      />

      <ImportDialog
        isOpen={modalStates.import}
        onClose={() => closeModal("import")}
        onImportComplete={handleImportComplete}
      />

      <ExportDialog
        isOpen={modalStates.export}
        onClose={handleCloseExportDialog}
        preselectedType={contextExportType || undefined}
        preselectedCategoryId={
          contextExportType === "category"
            ? contextExportId || undefined
            : undefined
        }
        preselectedDocumentId={
          contextExportType === "document"
            ? contextExportId || undefined
            : undefined
        }
      />

      {/* Document Delete Dialog */}
      <Dialog
        isOpen={modalStates.deleteDocument}
        onClose={() => {
          if (!isDeleting) {
            closeModal("deleteDocument");
            setDocumentToDelete(null);
          }
        }}
        title={t("documents.deleteTitle")}
        description={t("documents.deleteConfirmation", {
          title: documentToDelete?.title,
        })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        onConfirm={handleConfirmDelete}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MainLayout;
