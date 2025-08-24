import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { db } from "../../database";
import type { Category, CategoryWithChildren, Document } from "../../database";
import { Spinner, DocumentCard, CreateDocumentCard, Dialog } from "../UI";
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
import type { LayoutMode } from "../UI/LayoutToggle";
import DocumentListView from "../Documents/DocumentListView";
import LayoutToggle from "../UI/LayoutToggle";
import CompactDocumentRow from "../Documents/CompactDocumentRow";
import CategoryBreadcrumb from "../Category/CategoryBreadcrumb";

const MainLayout: React.FC = () => {
  const { t } = useTranslation();

  // Core data states
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryWithChildren | null>(null);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [parentCategoryForSubcategory, setParentCategoryForSubcategory] =
    useState<CategoryWithChildren | null>(null);
  const [categoryPath, setCategoryPath] = useState<Category[]>([]);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<{
    [key: number]: number;
  }>({});

  // View mode states
  const [viewMode, setViewMode] = useState<"list" | "editor" | "viewer">(
    "list"
  );
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null
  );
  const [editingDocumentId, setEditingDocumentId] = useState<number | null>(
    null
  );

  // UI states
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Dialog states - refactored
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [categorySelectModalOpen, setCategorySelectModalOpen] = useState(false);
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [categoryManagementModalOpen, setCategoryManagementModalOpen] =
    useState(false);
  const [unsavedChangesModalOpen, setUnsavedChangesModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingCategoryChange, setPendingCategoryChange] =
    useState<Category | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [contextExportType, setContextExportType] = useState<
    "category" | "document" | null
  >(null);
  const [contextExportId, setContextExportId] = useState<number | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("compact");

  // Determine sidebar collapse based on view mode
  const shouldSidebarCollapse = viewMode === "editor" || viewMode === "viewer";
  const effectiveSidebarCollapsed = shouldSidebarCollapse
    ? sidebarCollapsed
    : false;

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadDocuments(selectedCategory.id);
    }
  }, [selectedCategory]);

  useEffect(() => {
    const loadCounts = async () => {
      const counts: { [key: number]: number } = {};
      for (const cat of categories) {
        const docs = await db.getDocumentsByCategory(cat.id);
        counts[cat.id] = docs.length;
      }
      setCategoryCounts(counts);
    };

    if (categories.length > 0) {
      loadCounts();
    }
  }, [categories]);

  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const categoryExists = categories.find(
        (cat) => cat.id === selectedCategory.id
      );
      if (!categoryExists) {
        setDocuments([]);
        setSelectedCategory(categories[0]);
        if (viewMode !== "list") {
          setViewMode("list");
          setEditingDocumentId(null);
          setSelectedDocumentId(null);
          setHasUnsavedChanges(false);
        }
      }
    } else if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory, viewMode]);

  // Menu event handlers
  useMenuEvents({
    // Documents menu
    onNewDocument: () => setCategorySelectModalOpen(true),

    // Categories menu
    onNewCategory: () => setNewCategoryModalOpen(true),
    onManageCategories: () => setCategoryManagementModalOpen(true),

    // File menu
    onExportArchive: () => setExportDialogOpen(true),
    onImportArchive: () => setImportDialogOpen(true),
    onSettings: () => console.log("Settings"),

    // View menu
    onToggleSidebar: () => setSidebarVisible(!sidebarVisible),
    onSearch: () => {
      const searchInput = document.querySelector(
        'input[placeholder*="search"]'
      ) as HTMLInputElement;
      if (searchInput) searchInput.focus();
    },
    onReload: () => {
      loadCategories();
      if (selectedCategory) loadDocuments(selectedCategory.id);
    },

    // Help menu
    onAbout: () => console.log("About from menu"),
  });

  const loadCategories = async () => {
    try {
      const cats = await db.getCategoriesWithSubcategories();
      setCategories(cats);

      if (selectedCategory) {
        const updatedSelected = findCategoryInHierarchy(
          cats,
          selectedCategory.id
        );
        if (updatedSelected) {
          setSelectedCategory(updatedSelected);
          await updateCategoryPath(updatedSelected.id);
        }
      } else if (cats.length > 0) {
        // Auto-select first available category/subcategory
        const firstCategory = cats[0];
        if (
          firstCategory.subcategories &&
          firstCategory.subcategories.length > 0
        ) {
          const firstSubcategory: CategoryWithChildren = {
            ...firstCategory.subcategories[0],
            subcategories: [],
            documentCount: 0,
            totalDocumentCount: 0,
          };
          setSelectedCategory(firstSubcategory);
          await updateCategoryPath(firstSubcategory.id);
        } else {
          setSelectedCategory(firstCategory);
          await updateCategoryPath(firstCategory.id);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading categories:", error);
      setLoading(false);
    }
  };

  const loadDocuments = async (
    categoryId: number,
    includeSubcategories = false
  ) => {
    try {
      let docs: Document[] = [];

      if (includeSubcategories) {
        docs = await db.getDocumentsByCategoryTree(categoryId);
      } else {
        docs = await db.getDocumentsByCategory(categoryId);
      }

      docs.sort((a, b) =>
        a.title.localeCompare(b.title, "pt-BR", {
          sensitivity: "base",
          numeric: true,
        })
      );

      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await db.searchDocuments(query);
        setDocuments(results);
      } catch (error) {
        console.error("Error searching documents:", error);
      }
    } else if (selectedCategory) {
      loadDocuments(selectedCategory.id);
    }
  };

  // Navigation handlers - refactored
  const handleBackToList = () => {
    if (viewMode === "editor" && hasUnsavedChanges) {
      setPendingCategoryChange(null);
      setUnsavedChangesModalOpen(true);
    } else {
      setViewMode("list");
      setSelectedDocumentId(null);
      setEditingDocumentId(null);
      setHasUnsavedChanges(false);
    }
  };

  const handleCategoryChange = async (category: CategoryWithChildren) => {
    if (viewMode === "viewer") {
      setViewMode("list");
      setSelectedDocumentId(null);
      setSelectedCategory(category);
    } else if (viewMode === "editor" && hasUnsavedChanges) {
      setPendingCategoryChange(category);
      setUnsavedChangesModalOpen(true);
    } else {
      setSelectedCategory(category);
      await updateCategoryPath(category.id);

      // Determine if we should include subcategories in document loading
      const includeSubcategories =
        category.level === 0 &&
        category.subcategories &&
        category.subcategories.length > 0;

      await loadDocuments(category.id, includeSubcategories);

      if (viewMode === "editor") {
        setViewMode("list");
        setEditingDocumentId(null);
      }
    }
  };

  const handleCreateSubcategory = (parentCategory: CategoryWithChildren) => {
    setParentCategoryForSubcategory(parentCategory);
    setSubcategoryModalOpen(true);
  };

  // Handle subcategory creation
  const handleSubcategoryCreated = async (
    name: string,
    icon: string,
    color: string,
    parentId: number,
    description?: string
  ) => {
    try {
      await db.createCategory(name, icon, color, parentId, description);
      await loadCategories();
      console.log("Subcategory created successfully");
    } catch (error) {
      console.error("Error creating subcategory:", error);
      throw error;
    }
  };

  const handleCloseSubcategoryModal = () => {
    setSubcategoryModalOpen(false);
    setParentCategoryForSubcategory(null);
  };

  const handleBreadcrumbCategoryClick = async (category: Category) => {
    const categoryWithChildren = findCategoryInHierarchy(
      categories,
      category.id
    );
    if (categoryWithChildren) {
      await handleCategoryChange(categoryWithChildren);
    }
  };

  const handleHomeClick = async () => {
    if (categories.length > 0) {
      const firstCategory = categories[0];
      await handleCategoryChange(firstCategory);
    }
  };

  // Document operations
  const handleCreateDocument = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setViewMode("editor");
      setEditingDocumentId(null);
      setHasUnsavedChanges(false);
    } else {
      setCategorySelectModalOpen(true);
    }
  };

  const handleCategorySelected = (category: Category) => {
    setSelectedCategory(category);
    setViewMode("editor");
    setEditingDocumentId(null);
    setHasUnsavedChanges(false);
  };

  const handleViewDocument = (documentId: number) => {
    setSelectedDocumentId(documentId);
    setViewMode("viewer");
  };

  const handleEditDocument = (documentId: number) => {
    setEditingDocumentId(documentId);
    setViewMode("editor");
    setHasUnsavedChanges(false);
  };

  const handleDocumentCreated = () => {
    if (selectedCategory) {
      loadDocuments(selectedCategory.id);
      loadCategories();
    }
    setViewMode("list");
    setEditingDocumentId(null);
    setHasUnsavedChanges(false);
  };

  // Delete operations
  const handleDeleteDocument = (documentId: number) => {
    const document = documents.find((doc) => doc.id === documentId);
    if (document) {
      setDocumentToDelete(document);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      await db.deleteDocument(documentToDelete.id);

      if (selectedCategory) {
        loadDocuments(selectedCategory.id);
        loadCategories();
      }

      setDeleteDialogOpen(false);
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
      await db.createCategory(name, icon, color);
      await loadCategories();
      console.log("Category created successfully");
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  };

  const handleCategoryManagementUpdate = () => {
    const currentCategoryId = selectedCategory?.id;

    loadCategories().then(() => {
      if (currentCategoryId) {
        const categoryStillExists = categories.find(
          (cat) => cat.id === currentCategoryId
        );

        if (!categoryStillExists) {
          setDocuments([]);
          setSelectedCategory(categories.length > 0 ? categories[0] : null);

          if (viewMode !== "list") {
            setViewMode("list");
            setEditingDocumentId(null);
            setSelectedDocumentId(null);
            setHasUnsavedChanges(false);
          }
        }
      }
    });
  };

  // Unsaved changes dialog handlers - refactored
  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false);
    setUnsavedChangesModalOpen(false);
    setViewMode("list");
    setEditingDocumentId(null);
    if (pendingCategoryChange) {
      setSelectedCategory(pendingCategoryChange);
      setPendingCategoryChange(null);
    }
  };

  const handleSaveAndContinue = async () => {
    // TODO: Trigger save in editor component
    setHasUnsavedChanges(false);
    setUnsavedChangesModalOpen(false);
    setViewMode("list");
    setEditingDocumentId(null);
    if (pendingCategoryChange) {
      setSelectedCategory(pendingCategoryChange);
      setPendingCategoryChange(null);
    }
  };

  const handleCancelUnsavedChanges = () => {
    setUnsavedChangesModalOpen(false);
    setPendingCategoryChange(null);
  };

  const handleExportCategory = (categoryId: number) => {
    setContextExportType("category");
    setContextExportId(categoryId);
    setExportDialogOpen(true);
  };

  const handleExportDocument = (documentId: number) => {
    setContextExportType("document");
    setContextExportId(documentId);
    setExportDialogOpen(true);
  };

  const handleImportComplete = () => {
    // Refresh all data after successful import
    loadCategories();
    if (selectedCategory) {
      loadDocuments(selectedCategory.id);
    }
  };

  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
    setContextExportType(null);
    setContextExportId(null);
  };

  // Helper functions
  // Find category by ID in the hierarchical structure
  const findCategoryInHierarchy = (
    categories: CategoryWithChildren[],
    categoryId: number
  ): CategoryWithChildren | null => {
    for (const category of categories) {
      if (category.id === categoryId) {
        return category;
      }

      if (category.subcategories) {
        for (const subcategory of category.subcategories) {
          if (subcategory.id === categoryId) {
            return {
              ...subcategory,
              subcategories: [],
              documentCount: categoryCounts[subcategory.id] || 0,
              totalDocumentCount: categoryCounts[subcategory.id] || 0,
            };
          }
        }
      }
    }
    return null;
  };

  const updateCategoryPath = async (categoryId: number) => {
    try {
      const path = await db.getCategoryPath(categoryId);
      setCategoryPath(path);
    } catch (error) {
      console.error("Error loading category path:", error);
      setCategoryPath([]);
    }
  };

  const getAllCategoryNames = (
    categories: CategoryWithChildren[]
  ): string[] => {
    const names: string[] = [];
    categories.forEach((category) => {
      names.push(category.name);
      if (category.subcategories) {
        category.subcategories.forEach((sub) => names.push(sub.name));
      }
    });
    return names;
  };

  const getDocumentCreateSubtitle = (categoryName: string) => {
    const categoryKey = categoryName.toLowerCase();
    const subtitleKey = `documents.createSubtitle.${
      categoryKey === "receitas" || categoryKey === "recipes"
        ? "recipes"
        : categoryKey === "construção" || categoryKey === "construction"
        ? "construction"
        : categoryKey === "arquitetura" || categoryKey === "architecture"
        ? "architecture"
        : "default"
    }`;
    return t(subtitleKey);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen sage-bg-deepest">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-6 sage-text-white text-lg font-bold">
            {t("app.loading")}
          </p>
          <p className="mt-2 sage-text-mist">{t("app.loadingSubtitle")}</p>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAttachmentTypesForDocument = (_documentId: number): string[] => {
    // This is the existing function - keep the same logic
    const types = ["text"];
    if (Math.random() > 0.5) types.push("image");
    if (Math.random() > 0.7) types.push("pdf");
    if (Math.random() > 0.8) types.push("video");
    return types;
  };

  const createAttachmentTypesMap = () => {
    const map: { [key: number]: string[] } = {};
    documents.forEach((doc) => {
      map[doc.id] = getAttachmentTypesForDocument(doc.id);
    });
    return map;
  };

  return (
    <div className="h-screen sage-bg-deepest sage-text-white flex flex-col">
      {/* Header */}
      <Header
        mode={viewMode === "editor" ? "compact" : "normal"}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        createButtonDisabled={categories.length === 0}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Unified Sidebar */}
        {sidebarVisible && (
          <Sidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categoryCounts={categoryCounts}
            mode={viewMode === "list" ? "main" : "editor"}
            isCollapsed={effectiveSidebarCollapsed}
            onToggleCollapse={
              shouldSidebarCollapse
                ? () => setSidebarCollapsed(!sidebarCollapsed)
                : undefined
            }
            onClose={viewMode === "viewer" ? handleBackToList : undefined}
            onExportCategory={handleExportCategory}
            onCreateSubcategory={handleCreateSubcategory}
          />
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {viewMode === "editor" && selectedCategory ? (
            <DocumentEditor
              selectedCategory={selectedCategory}
              onClose={handleBackToList}
              onDocumentCreated={handleDocumentCreated}
              onContentChange={(hasChanges: boolean) =>
                setHasUnsavedChanges(hasChanges)
              }
              editingDocumentId={editingDocumentId || undefined}
              mode={editingDocumentId ? "edit" : "create"}
            />
          ) : viewMode === "viewer" &&
            selectedDocumentId &&
            selectedCategory ? (
            <DocumentViewer
              documentId={selectedDocumentId}
              selectedCategory={selectedCategory}
              onClose={handleBackToList}
              onEdit={handleEditDocument}
              onBackToList={handleBackToList}
            />
          ) : (
            /* Document List View */
            <main className="flex-1 p-8 overflow-y-auto sage-bg-deepest space-y-8">
              {selectedCategory ? (
                <>
                  {/* NEW BREADCRUMB SECTION */}
                  {categoryPath.length > 1 && (
                    <CategoryBreadcrumb
                      categoryPath={categoryPath}
                      onCategoryClick={handleBreadcrumbCategoryClick}
                      onHomeClick={handleHomeClick}
                      className="mb-4"
                    />
                  )}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: selectedCategory.color }}
                        >
                          <div className="text-white text-2xl">
                            {getCategoryIcon(
                              selectedCategory.name,
                              selectedCategory.icon
                            )}
                          </div>
                        </div>
                        <div>
                          <h2 className="text-4xl font-black sage-text-white">
                            {selectedCategory.name}
                          </h2>

                          {/* UPDATED SUBTITLE WITH SUBCATEGORY CONTEXT */}
                          <div className="flex items-center space-x-2">
                            <p className="sage-text-mist text-lg font-medium mt-1">
                              {t("categories.documentsCount", {
                                count: documents.length,
                              })}{" "}
                              {selectedCategory.level > 0
                                ? t("categories.documentsInSubcategory")
                                : t("categories.documentsInCategory")}
                            </p>

                            {/* Subcategory indicator */}
                            {selectedCategory.level > 0 && (
                              <span className="text-xs bg-sage-medium sage-text-cream px-2 py-1 rounded-full">
                                {t("categories.subcategory", "Subcategory")}
                              </span>
                            )}
                          </div>

                          {/* Show description if available */}
                          {selectedCategory.description && (
                            <p className="sage-text-light text-sm mt-2 italic">
                              {selectedCategory.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Layout Toggle unchanged */}
                      <LayoutToggle
                        currentMode={layoutMode}
                        onModeChange={setLayoutMode}
                        disabled={documents.length === 0}
                      />
                    </div>
                  </div>

                  {/* Dynamic Document Rendering based on Layout Mode */}
                  {layoutMode === "cards" ? (
                    // Original Cards Layout
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {documents.map((document) => (
                        <DocumentCard
                          key={document.id}
                          title={document.title}
                          description={
                            document.description || t("documents.noDescription")
                          }
                          date={formatDate(document.created_at)}
                          attachmentTypes={getAttachmentTypesForDocument(
                            document.id
                          )}
                          onView={() => handleViewDocument(document.id)}
                          onEdit={() => handleEditDocument(document.id)}
                          onDelete={() => handleDeleteDocument(document.id)}
                          onExport={() => handleExportDocument(document.id)}
                        />
                      ))}

                      <CreateDocumentCard
                        title={t("documents.create")}
                        subtitle={getDocumentCreateSubtitle(
                          selectedCategory.name
                        )}
                        onClick={() => handleCreateDocument(selectedCategory)}
                      />
                    </div>
                  ) : layoutMode === "compact" ? (
                    // Compact Rows Layout
                    <div className="space-y-2">
                      {documents.map((document) => (
                        <CompactDocumentRow
                          key={document.id}
                          document={document}
                          attachmentTypes={getAttachmentTypesForDocument(
                            document.id
                          )}
                          onView={() => handleViewDocument(document.id)}
                          onEdit={() => handleEditDocument(document.id)}
                          onDelete={() => handleDeleteDocument(document.id)}
                          onExport={() => handleExportDocument(document.id)}
                        />
                      ))}

                      {/* Create Document Card - Compact Version */}
                      <div
                        className="sage-bg-medium hover:sage-bg-light transition-all duration-200 rounded-xl p-4 cursor-pointer border-2 border-dashed sage-border hover:sage-border-gold group"
                        onClick={() => handleCreateDocument(selectedCategory)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 sage-bg-gold rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-2xl text-gray-800">🌱</span>
                          </div>
                          <div>
                            <p className="sage-text-cream font-bold">
                              {t("documents.create")}
                            </p>
                            <p className="sage-text-mist text-sm">
                              {getDocumentCreateSubtitle(selectedCategory.name)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Ultra-Compact List Layout
                    <div className="space-y-6">
                      <DocumentListView
                        documents={documents}
                        attachmentTypesMap={createAttachmentTypesMap()}
                        onView={handleViewDocument}
                        onEdit={handleEditDocument}
                        onDelete={handleDeleteDocument}
                        onExport={handleExportDocument}
                      />

                      {/* Create Document - List Version */}
                      <div
                        className="sage-bg-medium hover:sage-bg-light transition-all duration-200 rounded-xl p-3 cursor-pointer border sage-border hover:sage-border-gold group"
                        onClick={() => handleCreateDocument(selectedCategory)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 sage-bg-gold rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-lg text-gray-800">+</span>
                          </div>
                          <div>
                            <p className="sage-text-cream font-medium text-sm">
                              {t("documents.create")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Category not selected fallback - unchanged
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <span className="text-6xl mb-4 block">🌲</span>
                    <p className="sage-text-mist text-lg">
                      Selecione uma categoria para começar
                    </p>
                  </div>
                </div>
              )}
            </main>
          )}
        </div>
      </div>

      {/* Refactored Dialogs/Modals */}
      <CategorySelectModal
        isOpen={categorySelectModalOpen}
        onClose={() => setCategorySelectModalOpen(false)}
        onCategorySelect={handleCategorySelected}
        categories={categories}
      />

      <NewCategoryModal
        isOpen={newCategoryModalOpen}
        onClose={() => setNewCategoryModalOpen(false)}
        onCategoryCreate={handleCreateCategory}
        existingCategories={categories.map((cat) => cat.name)}
      />

      {/* NEW SUBCATEGORY MODAL */}
      <SubcategoryModal
        isOpen={subcategoryModalOpen}
        onClose={handleCloseSubcategoryModal}
        parentCategory={parentCategoryForSubcategory}
        onSubcategoryCreate={handleSubcategoryCreated}
        existingNames={getAllCategoryNames(categories)}
      />
      <CategoryManagementModal
        isOpen={categoryManagementModalOpen}
        onClose={() => setCategoryManagementModalOpen(false)}
        categories={categories}
        onCategoryUpdate={handleCategoryManagementUpdate}
        onNewCategory={() => {
          setCategoryManagementModalOpen(false);
          setNewCategoryModalOpen(true);
        }}
      />

      <UnsavedChangesModal
        isOpen={unsavedChangesModalOpen}
        onClose={handleCancelUnsavedChanges}
        onDiscard={handleDiscardChanges}
        onSave={handleSaveAndContinue}
        isLoading={false}
      />

      {/* Import Dialog */}
      <ImportDialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={exportDialogOpen}
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
        isOpen={deleteDialogOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteDialogOpen(false);
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
