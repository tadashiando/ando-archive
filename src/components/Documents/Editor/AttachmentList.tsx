import React, { useState } from "react";
import {
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon,
  DocumentIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Card, Badge, IconButton } from "../../UI";
import Dialog from "../../UI/Dialog";
import { db } from "../../../database";

interface AttachmentFile {
  file: File;
  preview?: string;
  type: "image" | "video" | "pdf" | "other";
  existingId?: number;
  existingPath?: string;
}

interface AttachmentListProps {
  attachments: AttachmentFile[];
  selectedAttachment: AttachmentFile | null;
  onAttachmentSelect: (attachment: AttachmentFile) => void;
  onAttachmentRemove: (file: File) => void;
  onAttachmentDeleted?: () => void;
  onSelectionClear?: () => void; // New prop to clear selection
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  mode?: "editor" | "viewer";
}

const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  selectedAttachment,
  onAttachmentSelect,
  onAttachmentRemove,
  onAttachmentDeleted,
  onSelectionClear,
  onFileUpload,
  isLoading = false,
  mode = "editor",
}) => {
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] =
    useState<AttachmentFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <PhotoIcon className="h-5 w-5" />;
      case "pdf":
        return <DocumentIcon className="h-5 w-5" />;
      case "video":
        return <VideoCameraIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const getBadgeVariant = (
    type: string
  ): "text" | "image" | "pdf" | "video" => {
    return type as "text" | "image" | "pdf" | "video";
  };

  const handleDeleteClick = (
    attachment: AttachmentFile,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setAttachmentToDelete(attachment);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!attachmentToDelete) return;

    // Check if we're deleting the currently selected attachment
    const isDeletingSelected =
      selectedAttachment?.file === attachmentToDelete.file;

    setIsDeleting(true);
    try {
      if (attachmentToDelete.existingId) {
        // Delete from database and file system
        await db.deleteAttachment(attachmentToDelete.existingId);

        // Clear selection if we deleted the selected attachment
        if (isDeletingSelected && onSelectionClear) {
          onSelectionClear();
        }

        // Notify parent to refresh attachments
        if (onAttachmentDeleted) {
          onAttachmentDeleted();
        }
      } else {
        // Clear selection if we deleted the selected attachment
        if (isDeletingSelected && onSelectionClear) {
          onSelectionClear();
        }

        // Just remove from local state (new attachment not saved yet)
        onAttachmentRemove(attachmentToDelete.file);
      }

      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    } catch (error) {
      console.error("Error deleting attachment:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDialog = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    }
  };

  return (
    <>
      <div className="w-96 sage-bg-dark border-l sage-border flex flex-col">
        <div className="p-4 border-b sage-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold sage-text-cream">
              {mode === "editor"
                ? t("modal.createDocument.attachmentsField")
                : `${t("attachments.title")} (${attachments.length})`}
            </h3>

            {mode === "editor" && (
              <div>
                <input
                  type="file"
                  multiple
                  onChange={onFileUpload}
                  className="hidden"
                  id="sidebar-file-upload"
                  accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
                  disabled={isLoading}
                />
                <IconButton
                  variant="ghost"
                  onClick={() =>
                    document.getElementById("sidebar-file-upload")?.click()
                  }
                  icon={<PlusIcon className="h-4 w-4" />}
                  label={t("common.add")}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {attachments.map((attachment, index) => (
              <Card
                key={mode === "editor" ? index : attachment.existingId || index}
                variant="ghost"
                padding="sm"
                className={`cursor-pointer transition-colors ${
                  selectedAttachment?.file === attachment.file
                    ? "sage-bg-light border-sage-gold"
                    : "hover:sage-bg-medium"
                }`}
                onClick={() => onAttachmentSelect(attachment)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getBadgeVariant(attachment.type)} size="sm">
                      {getFileIcon(attachment.type)}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="sage-text-cream text-sm font-medium truncate">
                        {attachment.file.name}
                      </p>
                      <p className="sage-text-mist text-xs">
                        {(attachment.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>

                  {mode === "editor" && (
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(attachment, e)}
                      icon={<XMarkIcon className="h-4 w-4" />}
                      disabled={isLoading || isDeleting}
                      label={t("common.delete")}
                      className="hover:bg-red-600/20 hover:text-red-400"
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog
        isOpen={deleteDialogOpen}
        onClose={handleCloseDialog}
        title={t("attachments.deleteTitle")}
        description={t("attachments.deleteConfirmation", {
          filename: attachmentToDelete?.file.name,
        })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        onConfirm={handleConfirmDelete}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};

export default AttachmentList;
