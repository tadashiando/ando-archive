import React from "react";
import {
  DocumentTextIcon,
  PhotoIcon,
  DocumentIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { Card, Badge } from "../../UI";

// Versão específica para o Viewer (com dados do banco)
interface ViewerAttachmentFile {
  id: number;
  filename: string;
  filepath: string;
  filetype: "image" | "video" | "pdf" | "other";
  filesize: number;
}

interface AttachmentListViewerProps {
  attachments: ViewerAttachmentFile[];
  selectedAttachment: ViewerAttachmentFile | null;
  onAttachmentSelect: (attachment: ViewerAttachmentFile) => void;
}

const AttachmentListViewer: React.FC<AttachmentListViewerProps> = ({
  attachments,
  selectedAttachment,
  onAttachmentSelect,
}) => {
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
        <h3 className="font-bold sage-text-cream mb-4">
          Anexos ({attachments.length})
        </h3>

        {/* Lista de Anexos */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {attachments.map((attachment) => (
            <Card
              key={attachment.id}
              variant="ghost"
              padding="sm"
              className={`cursor-pointer transition-colors ${
                selectedAttachment?.id === attachment.id
                  ? "sage-bg-light border-sage-gold"
                  : "hover:sage-bg-medium"
              }`}
              onClick={() => onAttachmentSelect(attachment)}
            >
              <div className="flex items-center space-x-2">
                <Badge variant={getBadgeVariant(attachment.filetype)} size="sm">
                  {getFileIcon(attachment.filetype)}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="sage-text-cream text-sm font-medium truncate">
                    {attachment.filename}
                  </p>
                  <p className="sage-text-mist text-xs">
                    {(attachment.filesize / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttachmentListViewer;
