import React from "react";
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
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  mode?: "editor" | "viewer";
}

const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  selectedAttachment,
  onAttachmentSelect,
  onAttachmentRemove,
  onFileUpload,
  isLoading = false,
  mode = "editor",
}) => {
  const { t } = useTranslation();

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

  return (
    <div className="w-96 sage-bg-dark border-l sage-border flex flex-col">
      {/* Header Anexos */}
      <div className="p-4 border-b sage-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold sage-text-cream">
            {mode === "editor"
              ? t("modal.createDocument.attachmentsField")
              : `Anexos (${attachments.length})`}
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

        {/* Lista de Anexos */}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onAttachmentRemove(attachment.file);
                    }}
                    icon={<XMarkIcon className="h-4 w-4" />}
                    disabled={isLoading}
                    label={t("common.delete")}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttachmentList;
