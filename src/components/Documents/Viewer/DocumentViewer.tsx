import React, { useState, useEffect } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { db } from "../../../database";
import type { Category, Document } from "../../../database";
import { Button } from "../../UI";
import DocumentNavigation from "./DocumentNavigation";
import AttachmentPreviewViewer from "./AttachmentPreview";
import AttachmentListViewer from "./AttachmentListViewer";

interface AttachmentFile {
  id: number;
  filename: string;
  filepath: string;
  filetype: "image" | "video" | "pdf" | "other";
  filesize: number;
}

interface DocumentViewerProps {
  documentId: number;
  selectedCategory: Category;
  onClose: () => void;
  onEdit: (documentId: number) => void;
  categories: Category[];
  onCategoryChange: (category: Category) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  selectedCategory,
  onClose,
  onEdit,
  categories,
  onCategoryChange,
}) => {
  const { t } = useTranslation();
  const [document, setDocument] = useState<Document | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentFile | null>(null);
  const [categoryDocuments, setCategoryDocuments] = useState<Document[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocument();
    loadCategoryDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, selectedCategory]);

  useEffect(() => {
    if (document) {
      loadAttachments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document]);

  useEffect(() => {
    // Encontrar índice do documento atual na lista da categoria
    const index = categoryDocuments.findIndex((doc) => doc.id === documentId);
    setCurrentIndex(index);
  }, [documentId, categoryDocuments]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      // TODO: Implementar getDocumentById no database manager
      // Por enquanto, buscar na categoria
      const docs = await db.getDocumentsByCategory(selectedCategory.id);
      const foundDoc = docs.find((doc) => doc.id === documentId);
      setDocument(foundDoc || null);
    } catch (error) {
      console.error("Error loading document:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryDocuments = async () => {
    try {
      const docs = await db.getDocumentsByCategory(selectedCategory.id);
      setCategoryDocuments(docs);
    } catch (error) {
      console.error("Error loading category documents:", error);
    }
  };

  const loadAttachments = async () => {
    if (!document) return;

    try {
      const attachs = await db.getAttachments(document.id);
      const processedAttachments: AttachmentFile[] = attachs.map((att) => ({
        id: att.id,
        filename: att.filename,
        filepath: att.filepath,
        filetype: getFileType(att.filetype),
        filesize: att.filesize,
      }));

      setAttachments(processedAttachments);
      if (processedAttachments.length > 0) {
        setSelectedAttachment(processedAttachments[0]);
      }
    } catch (error) {
      console.error("Error loading attachments:", error);
    }
  };

  const getFileType = (
    filetype: string
  ): "image" | "video" | "pdf" | "other" => {
    if (filetype.startsWith("image/")) return "image";
    if (filetype.startsWith("video/")) return "video";
    if (filetype === "application/pdf") return "pdf";
    return "other";
  };

  const navigateDocument = (direction: "prev" | "next") => {
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < categoryDocuments.length) {
      const newDocument = categoryDocuments[newIndex];
      // TODO: Implementar navegação (atualizar prop ou callback)
      console.log("Navigate to document:", newDocument.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading || !document) {
    return (
      <div className="flex items-center justify-center h-full sage-bg-deepest">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
          <p className="mt-4 sage-text-white">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar Colapsável - Categorias */}
      <DocumentNavigation
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        currentIndex={currentIndex}
        totalDocuments={categoryDocuments.length}
        onNavigateDocument={navigateDocument}
        onClose={onClose}
      />

      {/* Área Principal - Conteúdo do Documento */}
      <div className="flex-1 flex flex-col">
        {/* Header do Document */}
        <div className="sage-header p-4 border-b sage-border">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold sage-text-white mb-1">
                {document.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm sage-text-mist">
                <span>Criado em {formatDate(document.created_at)}</span>
                {document.updated_at !== document.created_at && (
                  <span>• Atualizado em {formatDate(document.updated_at)}</span>
                )}
              </div>
            </div>

            <Button variant="primary" onClick={() => onEdit(document.id)}>
              <PencilIcon className="h-5 w-5 mr-2" />
              {t("documents.edit")}
            </Button>
          </div>
        </div>

        {/* Layout Principal - 2 Colunas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conteúdo do Documento */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div
              className="sage-text-cream prose prose-invert max-w-none prose-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: document.text_content }}
            />
          </div>

          {/* Sidebar Direita - Anexos */}
          {attachments.length > 0 && (
            <div className="w-96 sage-bg-dark border-l sage-border flex flex-col">
              {/* Header Anexos */}
              <AttachmentListViewer
                attachments={attachments}
                selectedAttachment={selectedAttachment}
                onAttachmentSelect={setSelectedAttachment}
              />

              {/* Preview Area */}
              <div className="flex-1 p-4">
                <div className="h-full sage-bg-medium rounded-xl p-4">
                  <AttachmentPreviewViewer attachment={selectedAttachment} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
