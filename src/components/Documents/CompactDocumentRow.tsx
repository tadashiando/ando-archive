import React from "react";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Card, IconButton } from "../UI";
import type { Document } from "../../database";

interface CompactDocumentRowProps {
  document: Document;
  attachmentTypes: string[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
}

const CompactDocumentRow: React.FC<CompactDocumentRowProps> = ({
  document,
  attachmentTypes,
  onView,
  onEdit,
  onDelete,
  onExport,
}) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case "image":
        return { bg: "bg-blue-500", text: "I", title: t("fileTypes.image") };
      case "pdf":
        return { bg: "bg-red-500", text: "P", title: t("fileTypes.pdf") };
      case "video":
        return { bg: "bg-purple-500", text: "V", title: t("fileTypes.video") };
      default:
        return { bg: "bg-gray-500", text: "T", title: t("fileTypes.text") };
    }
  };

  return (
    <Card
      variant="ghost"
      padding="sm"
      className="sage-bg-medium hover:sage-bg-light transition-all duration-200 group cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-center justify-between py-2 px-2">
        {/* Left: Title + Attachments + Description */}
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center space-x-3 mb-1">
            {/* Title */}
            <h3 className="font-bold sage-text-cream text-base truncate flex-shrink-0 max-w-xs">
              {document.title}
            </h3>

            {/* Attachment badges - compact circles */}
            {attachmentTypes.length > 0 && (
              <div className="flex space-x-1 flex-shrink-0">
                {attachmentTypes.slice(0, 4).map((type, index) => {
                  const iconData = getAttachmentIcon(type);
                  return (
                    <div
                      key={`${type}-${index}`}
                      className={`
                        w-5 h-5 rounded-full flex items-center justify-center 
                        text-xs font-bold text-white ${iconData.bg}
                      `}
                      title={iconData.title}
                    >
                      {iconData.text}
                    </div>
                  );
                })}
                {attachmentTypes.length > 4 && (
                  <div className="w-5 h-5 rounded-full bg-sage-mist flex items-center justify-center text-xs font-bold text-gray-800">
                    +{attachmentTypes.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description - only if exists and not too long */}
          {document.description && document.description.trim() && (
            <p className="sage-text-mist text-sm truncate max-w-md">
              {document.description}
            </p>
          )}
        </div>

        {/* Center: Date */}
        <div className="text-sm sage-text-light font-medium mr-6 flex-shrink-0 hidden sm:block">
          {formatDate(document.created_at)}
        </div>

        {/* Right: Actions - hidden until hover */}
        <div
          className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
          onClick={(e) => e.stopPropagation()} // Prevent card click when clicking actions
        >
          <IconButton
            size="sm"
            variant="ghost"
            onClick={onView}
            icon={<EyeIcon className="h-4 w-4" />}
            label={t("documents.view")}
            className="hover:sage-bg-gold hover:text-gray-800"
          />
          <IconButton
            size="sm"
            variant="ghost"
            onClick={onEdit}
            icon={<PencilIcon className="h-4 w-4" />}
            label={t("documents.edit")}
            className="hover:sage-bg-gold hover:text-gray-800"
          />
          <IconButton
            size="sm"
            variant="ghost"
            onClick={onExport}
            icon={<DocumentArrowDownIcon className="h-4 w-4" />}
            label={t("documents.export")}
            className="hover:bg-blue-600/20 hover:text-blue-400"
          />
          <IconButton
            size="sm"
            variant="ghost"
            onClick={onDelete}
            icon={<TrashIcon className="h-4 w-4" />}
            label={t("common.delete")}
            className="hover:bg-red-600/20 hover:text-red-400"
          />
        </div>
      </div>
    </Card>
  );
};

export default CompactDocumentRow;
