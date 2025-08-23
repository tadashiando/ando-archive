import React, { useState, useEffect } from "react";
import { ChevronLeftIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { db } from "../../../database";
import type { Category, Document } from "../../../database";
import { Button, IconButton } from "../../UI";
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
  onBackToList?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  selectedCategory,
  onEdit,
  onBackToList,
}) => {
  const { t } = useTranslation();
  const [document, setDocument] = useState<Document | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, selectedCategory]);

  useEffect(() => {
    if (document) {
      loadAttachments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      const doc = await db.getDocumentById(documentId);
      setDocument(doc);
    } catch (error) {
      console.error("Error loading document:", error);
    } finally {
      setLoading(false);
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
      <div className="flex-1 flex flex-col">
        <div className="sage-header p-4 border-b sage-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onBackToList && (
                <IconButton
                  variant="ghost"
                  onClick={onBackToList}
                  icon={<ChevronLeftIcon className="h-5 w-5" />}
                  label="Voltar à lista"
                />
              )}

              <div className="flex-1">
                <h1 className="text-2xl font-bold sage-text-white mb-1">
                  {document.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm sage-text-mist">
                  <span>Criado em {formatDate(document.created_at)}</span>
                  {document.updated_at !== document.created_at && (
                    <span>
                      • Atualizado em {formatDate(document.updated_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button variant="primary" onClick={() => onEdit(document.id)}>
              <PencilIcon className="h-5 w-5 mr-2" />
              {t("documents.edit")}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto">
            <div
              className="sage-text-cream prose prose-invert max-w-none prose-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: document.text_content }}
            />
          </div>

          {attachments.length > 0 && (
            <div className="w-96 sage-bg-dark border-l sage-border flex flex-col">
              <AttachmentListViewer
                attachments={attachments}
                selectedAttachment={selectedAttachment}
                onAttachmentSelect={setSelectedAttachment}
              />

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
