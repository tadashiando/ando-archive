import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { db } from "../../database";
import type { Category, Document } from "../../database";
import { Spinner, DocumentCard, CreateDocumentCard } from "../UI";
import DocumentEditor from "../Documents/Editor/DocumentEditor";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DocumentViewer from "../Documents/Viewer/DocumentViewer";
import Dialog from "../UI/Dialog";

const MainLayout: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<{
    [key: number]: number;
  }>({});
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [viewerMode, setViewerMode] = useState<"list" | "view" | "edit">(
    "list"
  );
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
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

  const loadCategories = async () => {
    try {
      const cats = await db.getCategories();
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCategory(cats[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading categories:", error);
      setLoading(false);
    }
  };

  const loadDocuments = async (categoryId: number) => {
    try {
      const docs = await db.getDocumentsByCategory(categoryId);
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

  const handleDocumentCreated = () => {
    if (selectedCategory) {
      loadDocuments(selectedCategory.id);
      loadCategories(); // Para atualizar contadores
    }
    setIsEditorMode(false); // Fechar editor após criar
  };

  const handleCreateDocument = () => {
    setIsEditorMode(true);
  };

  const handleCloseEditor = () => {
    setIsEditorMode(false);
  };

  const handleViewDocument = (documentId: number) => {
    setSelectedDocumentId(documentId);
    setViewerMode("view");
  };

  const handleEditDocument = (documentId: number) => {
    setSelectedDocumentId(documentId);
    setIsEditorMode(true);
    setViewerMode("list"); // Não vai para viewer, vai direto pro editor
  };

  const handleCloseViewer = () => {
    setViewerMode("list");
    setSelectedDocumentId(null);
  };

  const handleNewCategory = () => {
    // TODO: Implementar modal/form para nova categoria
    console.log("Criar nova categoria");
  };

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
      console.error("Error deleting document: ", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getAttachmentTypes = () => {
    const types = ["text"];
    if (Math.random() > 0.5) types.push("image");
    if (Math.random() > 0.7) types.push("pdf");
    if (Math.random() > 0.8) types.push("video");
    return types;
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case "Receitas":
      case "Recipes":
        return "🌿";
      case "Construção":
      case "Construction":
        return "🏡";
      case "Arquitetura":
      case "Architecture":
        return "🏛️";
      case "Educação":
      case "Education":
        return "📚";
      default:
        return "📁";
    }
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

  return (
    <div className="h-screen sage-bg-deepest sage-text-white flex flex-col">
      {/* Header */}
      <Header
        mode={isEditorMode ? "compact" : "normal"}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onCreateClick={handleCreateDocument}
        createButtonDisabled={!selectedCategory}
      />

      {/* Conteúdo Condicional */}
      {viewerMode === "view" && selectedDocumentId && selectedCategory ? (
        <DocumentViewer
          documentId={selectedDocumentId}
          selectedCategory={selectedCategory}
          onClose={handleCloseViewer}
          onEdit={handleEditDocument}
          categories={categories}
          onCategoryChange={setSelectedCategory}
        />
      ) : isEditorMode && selectedCategory ? (
        <DocumentEditor
          selectedCategory={selectedCategory}
          onClose={handleCloseEditor}
          onDocumentCreated={handleDocumentCreated}
          categories={categories}
          onCategoryChange={setSelectedCategory}
          editingDocumentId={selectedDocumentId || undefined}
          mode={selectedDocumentId ? "edit" : "create"}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Categorias */}
          <Sidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onNewCategory={handleNewCategory}
            categoryCounts={categoryCounts}
            mode="normal"
            isCollapsible={false}
          />

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-y-auto sage-bg-deepest space-y-8">
            {selectedCategory ? (
              <>
                <div className="mb-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="text-5xl">
                      {getCategoryIcon(selectedCategory.name)}
                    </span>
                    <div>
                      <h2 className="text-4xl font-black sage-text-white">
                        {selectedCategory.name}
                      </h2>
                      <p className="sage-text-mist text-lg font-medium mt-1">
                        {t("categories.documentsCount", {
                          count: documents.length,
                        })}{" "}
                        {t("categories.documentsInCategory")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grid de Documentos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {documents.map((document) => {
                    const attachmentTypes = getAttachmentTypes();

                    return (
                      <DocumentCard
                        key={document.id}
                        title={document.title}
                        description={
                          document.description || t("documents.noDescription")
                        }
                        date={formatDate(document.created_at)}
                        attachmentTypes={attachmentTypes}
                        onView={() => handleViewDocument(document.id)}
                        onEdit={() => handleEditDocument(document.id)}
                        onDelete={() => handleDeleteDocument(document.id)}
                      />
                    );
                  })}

                  {/* Card para adicionar novo documento */}
                  <CreateDocumentCard
                    title={t("documents.create")}
                    subtitle={getDocumentCreateSubtitle(selectedCategory.name)}
                    onClick={() => handleCreateDocument()}
                  />
                </div>
              </>
            ) : (
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
        </div>
      )}
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
