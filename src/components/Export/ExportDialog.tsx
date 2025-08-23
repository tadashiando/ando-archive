import React, { useState, useEffect } from "react";
import {
  FolderIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ArchiveBoxIcon,
  DocumentIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";
import { save } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
import { Dialog, Button, Card, Label } from "../UI";
import { ExportEngine } from "../../utils/exportEngine";
import type { ExportOptions } from "../../utils/exportEngine";
import { db } from "../../database";
import type { Category, Document } from "../../database";

interface SelectiveExportStats {
  categories: number;
  documents: number;
  attachments: number;
  estimatedSize: number;
  selectionInfo?: string;
}

interface ExportProgress {
  phase: "collecting" | "copying-attachments" | "creating-archive" | "complete";
  progress: number;
  currentItem?: string;
  message: string;
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional pre-selection
  preselectedType?: "category" | "document";
  preselectedCategoryId?: number;
  preselectedDocumentId?: number;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  preselectedType,
  preselectedCategoryId,
  preselectedDocumentId,
}) => {
  const { t } = useTranslation();

  // Selection state
  const [exportType, setExportType] = useState<
    "complete" | "category" | "document"
  >("complete");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null
  );

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<SelectiveExportStats | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportPath, setExportPath] = useState<string | null>(null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize with preselection
  useEffect(() => {
    if (isOpen) {
      if (preselectedType) {
        setExportType(preselectedType);
      }
      if (preselectedCategoryId) {
        setSelectedCategoryId(preselectedCategoryId);
      }
      if (preselectedDocumentId) {
        setSelectedDocumentId(preselectedDocumentId);
      }
      loadData();
    }
  }, [isOpen, preselectedType, preselectedCategoryId, preselectedDocumentId]);

  // Update stats when selection changes
  useEffect(() => {
    if (isOpen && categories.length > 0) {
      loadStats();
    }
  }, [exportType, selectedCategoryId, selectedDocumentId, categories]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [categoriesData, documentsData] = await Promise.all([
        db.getCategories(),
        getAllDocuments(),
      ]);

      setCategories(categoriesData);
      setDocuments(documentsData);

      // Set defaults
      if (!selectedCategoryId && categoriesData.length > 0) {
        setSelectedCategoryId(categoriesData[0].id);
      }
      if (!selectedDocumentId && documentsData.length > 0) {
        setSelectedDocumentId(documentsData[0].id);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError(t("export.errors.loadStats"));
    } finally {
      setIsLoading(false);
    }
  };

  const getAllDocuments = async (): Promise<Document[]> => {
    const categories = await db.getCategories();
    const allDocs: Document[] = [];

    for (const category of categories) {
      const categoryDocs = await db.getDocumentsByCategory(category.id);
      allDocs.push(...categoryDocs);
    }

    return allDocs.sort((a, b) => a.title.localeCompare(b.title));
  };

  const loadStats = async () => {
    if (isLoading) return;

    try {
      const options: ExportOptions = {
        type: exportType,
        categoryId:
          exportType === "category"
            ? selectedCategoryId || undefined
            : undefined,
        documentId:
          exportType === "document"
            ? selectedDocumentId || undefined
            : undefined,
      };

      const exportEngine = new ExportEngine();
      const exportStats = await exportEngine.getSelectiveExportStats(options);
      setStats(exportStats);
    } catch (err) {
      console.error("Failed to load export stats:", err);
      setError(t("export.errors.loadStats"));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleChooseLocation = async () => {
    try {
      const defaultName = getDefaultFileName();

      const selectedPath = await save({
        title: t("export.dialog.chooseLocation"),
        defaultPath: defaultName,
        filters: [
          {
            name: t("export.fileType.name"),
            extensions: ["andoarchive"],
          },
        ],
      });

      if (selectedPath) {
        setExportPath(selectedPath);
      }
    } catch (err) {
      console.error("Failed to choose export location:", err);
      setError(t("export.errors.chooseLocation"));
    }
  };

  const getDefaultFileName = (): string => {
    const date = new Date().toISOString().split("T")[0];

    switch (exportType) {
      case "category": {
        const category = categories.find(
          (cat) => cat.id === selectedCategoryId
        );
        const categoryName =
          category?.name.toLowerCase().replace(/\s+/g, "-") || "category";
        return `ando-${categoryName}-${date}.andoarchive`;
      }

      case "document": {
        const document = documents.find((doc) => doc.id === selectedDocumentId);
        const docName =
          document?.title.toLowerCase().replace(/\s+/g, "-").substring(0, 20) ||
          "document";
        return `ando-${docName}-${date}.andoarchive`;
      }

      default:
        return `ando-archive-${date}.andoarchive`;
    }
  };

  const handleStartExport = async () => {
    if (!exportPath) return;

    setIsExporting(true);
    setError(null);
    setSuccess(false);
    setProgress(null);

    try {
      const options: ExportOptions = {
        type: exportType,
        categoryId:
          exportType === "category"
            ? selectedCategoryId || undefined
            : undefined,
        documentId:
          exportType === "document"
            ? selectedDocumentId || undefined
            : undefined,
      };

      const exportEngine = new ExportEngine((progressUpdate) => {
        setProgress(progressUpdate);
      });

      await exportEngine.exportArchive(exportPath, options);
      setSuccess(true);
      setProgress(null);
    } catch (err) {
      console.error("Export failed:", err);
      setError(err instanceof Error ? err.message : t("export.errors.unknown"));
      setProgress(null);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      // Reset state when closing
      setStats(null);
      setExportPath(null);
      setProgress(null);
      setError(null);
      setSuccess(false);
      setExportType("complete");
      setSelectedCategoryId(null);
      setSelectedDocumentId(null);
      onClose();
    }
  };

  const getDialogTitle = () => {
    if (success) return t("export.dialog.successTitle");
    if (isExporting) return t("export.dialog.exportingTitle");
    return t("export.dialog.title");
  };

  const getDialogVariant = () => {
    if (error) return "danger" as const;
    if (success) return "success" as const;
    return "default" as const;
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={getDialogTitle()}
      description={t("export.dialog.description")}
      variant={getDialogVariant()}
      size="lg"
      showCloseButton={!isExporting}
      closeOnOverlayClick={!isExporting}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-8 w-8 animate-spin sage-text-mist mr-3" />
          <p className="sage-text-cream">{t("export.dialog.loadingStats")}</p>
        </div>
      )}

      {/* Error State */}
      {error && !isExporting && (
        <Card
          variant="ghost"
          padding="md"
          className="bg-red-900/20 border-red-500 mb-4"
        >
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-red-300 font-medium">
                {t("export.dialog.errorTitle")}
              </p>
              <p className="text-red-400 text-sm mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Success State */}
      {success && (
        <Card
          variant="ghost"
          padding="md"
          className="bg-green-900/20 border-green-500 mb-4"
        >
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-green-300 font-medium">
                {t("export.dialog.successMessage")}
              </p>
              <p className="text-green-400 text-sm mt-1">
                {t("export.dialog.savedTo")}: {exportPath}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Export Progress */}
      {isExporting && progress && (
        <Card variant="ghost" padding="md" className="mb-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="sage-text-cream font-medium">{progress.message}</p>
              <span className="sage-text-mist text-sm">
                {progress.progress}%
              </span>
            </div>

            <div className="w-full bg-sage-medium rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-600 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>

            {progress.currentItem && (
              <p className="sage-text-mist text-sm">
                {t("export.dialog.currentItem")}: {progress.currentItem}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Export Type Selection */}
      {!isExporting && !success && !isLoading && (
        <div className="space-y-4 mb-6">
          <div>
            <Label>{t("export.dialog.exportType")}</Label>
            <div className="space-y-2">
              {/* Complete Archive */}
              <Card
                variant="ghost"
                padding="md"
                className={`cursor-pointer transition-all ${
                  exportType === "complete"
                    ? "sage-bg-gold border-sage-gold text-gray-800"
                    : "sage-bg-medium hover:sage-bg-light"
                }`}
                onClick={() => setExportType("complete")}
              >
                <div className="flex items-center space-x-3">
                  <ArchiveBoxIcon
                    className={`h-5 w-5 ${
                      exportType === "complete"
                        ? "text-gray-800"
                        : "sage-text-gold"
                    }`}
                  />
                  <div>
                    <p
                      className={`font-medium ${
                        exportType === "complete"
                          ? "text-gray-800"
                          : "sage-text-cream"
                      }`}
                    >
                      {t("export.types.complete")}
                    </p>
                    <p
                      className={`text-sm ${
                        exportType === "complete"
                          ? "text-gray-600"
                          : "sage-text-mist"
                      }`}
                    >
                      {t("export.types.completeDescription")}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Single Category */}
              <Card
                variant="ghost"
                padding="md"
                className={`cursor-pointer transition-all ${
                  exportType === "category"
                    ? "sage-bg-gold border-sage-gold text-gray-800"
                    : "sage-bg-medium hover:sage-bg-light"
                }`}
                onClick={() => setExportType("category")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FolderOpenIcon
                      className={`h-5 w-5 ${
                        exportType === "category"
                          ? "text-gray-800"
                          : "sage-text-gold"
                      }`}
                    />
                    <div>
                      <p
                        className={`font-medium ${
                          exportType === "category"
                            ? "text-gray-800"
                            : "sage-text-cream"
                        }`}
                      >
                        {t("export.types.category")}
                      </p>
                      <p
                        className={`text-sm ${
                          exportType === "category"
                            ? "text-gray-600"
                            : "sage-text-mist"
                        }`}
                      >
                        {t("export.types.categoryDescription")}
                      </p>
                    </div>
                  </div>

                  {exportType === "category" && categories.length > 0 && (
                    <select
                      value={selectedCategoryId || ""}
                      onChange={(e) =>
                        setSelectedCategoryId(Number(e.target.value))
                      }
                      className="ml-3 px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </Card>

              {/* Single Document */}
              <Card
                variant="ghost"
                padding="md"
                className={`cursor-pointer transition-all ${
                  exportType === "document"
                    ? "sage-bg-gold border-sage-gold text-gray-800"
                    : "sage-bg-medium hover:sage-bg-light"
                }`}
                onClick={() => setExportType("document")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <DocumentIcon
                      className={`h-5 w-5 ${
                        exportType === "document"
                          ? "text-gray-800"
                          : "sage-text-gold"
                      }`}
                    />
                    <div>
                      <p
                        className={`font-medium ${
                          exportType === "document"
                            ? "text-gray-800"
                            : "sage-text-cream"
                        }`}
                      >
                        {t("export.types.document")}
                      </p>
                      <p
                        className={`text-sm ${
                          exportType === "document"
                            ? "text-gray-600"
                            : "sage-text-mist"
                        }`}
                      >
                        {t("export.types.documentDescription")}
                      </p>
                    </div>
                  </div>

                  {exportType === "document" && documents.length > 0 && (
                    <select
                      value={selectedDocumentId || ""}
                      onChange={(e) =>
                        setSelectedDocumentId(Number(e.target.value))
                      }
                      className="ml-3 px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm max-w-48"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {documents.map((document) => (
                        <option key={document.id} value={document.id}>
                          {document.title.length > 30
                            ? document.title.substring(0, 30) + "..."
                            : document.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Stats Display */}
          {stats && (
            <div>
              <Label>{t("export.dialog.exportStats")}</Label>
              {stats.selectionInfo && (
                <div className="mb-2">
                  <p className="sage-text-gold text-sm font-medium">
                    {t("export.dialog.selection")}: {stats.selectionInfo}
                  </p>
                </div>
              )}
              <Card variant="ghost" padding="md" className="sage-bg-medium">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <FolderIcon className="h-5 w-5 sage-text-gold" />
                    <div>
                      <p className="sage-text-cream font-medium">
                        {stats.categories}
                      </p>
                      <p className="sage-text-mist text-sm">
                        {t("export.stats.categories")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DocumentArrowDownIcon className="h-5 w-5 sage-text-gold" />
                    <div>
                      <p className="sage-text-cream font-medium">
                        {stats.documents}
                      </p>
                      <p className="sage-text-mist text-sm">
                        {t("export.stats.documents")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DocumentIcon className="h-5 w-5 sage-text-gold" />
                    <div>
                      <p className="sage-text-cream font-medium">
                        {stats.attachments}
                      </p>
                      <p className="sage-text-mist text-sm">
                        {t("export.stats.attachments")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded bg-sage-gold flex items-center justify-center">
                      <span className="text-xs text-gray-800 font-bold">~</span>
                    </div>
                    <div>
                      <p className="sage-text-cream font-medium">
                        {formatFileSize(stats.estimatedSize)}
                      </p>
                      <p className="sage-text-mist text-sm">
                        {t("export.stats.estimatedSize")}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Export Location */}
          <div>
            <Label>{t("export.dialog.exportLocation")}</Label>
            <div className="flex space-x-3">
              <div className="flex-1">
                <Card
                  variant="ghost"
                  padding="md"
                  className={`sage-bg-medium ${
                    !exportPath ? "border-dashed" : ""
                  }`}
                >
                  {exportPath ? (
                    <p className="sage-text-cream text-sm break-all">
                      {exportPath}
                    </p>
                  ) : (
                    <p className="sage-text-mist text-sm">
                      {t("export.dialog.noLocationSelected")}
                    </p>
                  )}
                </Card>
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={handleChooseLocation}
                disabled={isLoading}
              >
                <FolderIcon className="h-4 w-4 mr-2" />
                {t("export.dialog.chooseLocation")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isExporting && (
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            {success ? t("common.close") : t("common.cancel")}
          </Button>

          {!success && stats && (
            <Button
              variant="primary"
              onClick={handleStartExport}
              disabled={isLoading || !exportPath || !stats}
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {t("export.dialog.startExport")}
            </Button>
          )}
        </div>
      )}
    </Dialog>
  );
};

export default ExportDialog;
