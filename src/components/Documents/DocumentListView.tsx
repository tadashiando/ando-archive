import React from "react";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { IconButton } from "../UI";
import type { Document } from "../../database";

interface DocumentListViewProps {
  documents: Document[];
  attachmentTypesMap: { [key: number]: string[] };
  onView: (documentId: number) => void;
  onEdit: (documentId: number) => void;
  onDelete: (documentId: number) => void;
  onExport: (documentId: number) => void;
}

const DocumentListView: React.FC<DocumentListViewProps> = ({
  documents,
  attachmentTypesMap,
  onView,
  onEdit,
  onDelete,
  onExport,
}) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl mb-4 block">📄</span>
        <p className="sage-text-mist">{t("documents.noDocuments")}</p>
      </div>
    );
  }

  return (
    <div className="sage-bg-medium rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b sage-border bg-sage-dark">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium sage-text-mist">
          <div className="col-span-5 sm:col-span-6">{t("documents.title")}</div>
          <div className="col-span-2 hidden sm:block">
            {t("documents.attachments")}
          </div>
          <div className="col-span-2 hidden md:block">
            {t("documents.date")}
          </div>
          <div className="col-span-5 sm:col-span-4 md:col-span-2 text-right">
            {t("documents.actions")}
          </div>
        </div>
      </div>

      {/* Document Rows */}
      <div className="divide-y sage-border">
        {documents.map((document) => {
          const attachmentTypes = attachmentTypesMap[document.id] || [];

          return (
            <div
              key={document.id}
              className="px-4 py-3 hover:sage-bg-light transition-colors duration-200 group cursor-pointer"
              onClick={() => onView(document.id)}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Title + Description */}
                <div className="col-span-5 sm:col-span-6 min-w-0">
                  <h3 className="font-medium sage-text-cream text-sm truncate">
                    {document.title}
                  </h3>
                  {document.description && (
                    <p className="sage-text-mist text-xs truncate mt-0.5">
                      {document.description}
                    </p>
                  )}
                </div>

                {/* Attachments */}
                <div className="col-span-2 hidden sm:block">
                  {attachmentTypes.length > 0 ? (
                    <div className="flex items-center space-x-1">
                      <PaperClipIcon className="h-3 w-3 sage-text-mist" />
                      <span className="text-xs sage-text-mist">
                        {attachmentTypes.length}
                      </span>
                      {/* Show first few types */}
                      <div className="flex space-x-0.5">
                        {attachmentTypes.slice(0, 3).map((type, index) => (
                          <div
                            key={`${type}-${index}`}
                            className={`
                              w-3 h-3 rounded-full text-xs flex items-center justify-center
                              ${type === "image" ? "bg-blue-400" : ""}
                              ${type === "pdf" ? "bg-red-400" : ""}
                              ${type === "video" ? "bg-purple-400" : ""}
                              ${type === "text" ? "bg-gray-400" : ""}
                            `}
                            title={t(`fileTypes.${type}`)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs sage-text-mist">—</span>
                  )}
                </div>

                {/* Date */}
                <div className="col-span-2 hidden md:block">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-3 w-3 sage-text-mist" />
                    <span className="text-xs sage-text-light">
                      {formatDate(document.created_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="col-span-5 sm:col-span-4 md:col-span-2 flex justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => onView(document.id)}
                      icon={<EyeIcon className="h-3 w-3" />}
                      label={t("documents.view")}
                      className="hover:sage-bg-gold hover:text-gray-800"
                    />
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(document.id)}
                      icon={<PencilIcon className="h-3 w-3" />}
                      label={t("documents.edit")}
                      className="hover:sage-bg-gold hover:text-gray-800"
                    />
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => onExport(document.id)}
                      icon={<DocumentArrowDownIcon className="h-3 w-3" />}
                      label={t("documents.export")}
                      className="hover:bg-blue-600/20 hover:text-blue-400"
                    />
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(document.id)}
                      icon={<TrashIcon className="h-3 w-3" />}
                      label={t("common.delete")}
                      className="hover:bg-red-600/20 hover:text-red-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentListView;
