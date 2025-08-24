// src/components/Import/ImportDialog.tsx
import React, { useState } from "react";
import {
  FolderIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";
import { open } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
import { Dialog, Button, Card, Label } from "../UI";
import { ImportEngine } from "../../utils/importEngine";
import type {
  ConflictResolution,
  ImportPreview,
  ImportProgress,
} from "../../utils/importEngine";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { t } = useTranslation();

  // File selection
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Preview state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Conflict resolution
  const [conflictResolution, setConflictResolution] =
    useState<ConflictResolution>({
      categories: "merge",
      documents: "merge",
    });

  const handleSelectFile = async () => {
    try {
      const selectedPath = await open({
        title: t("import.dialog.selectFile"),
        filters: [
          {
            name: t("import.fileType.name"),
            extensions: ["andoarchive"],
          },
        ],
      });

      if (selectedPath) {
        setSelectedFile(selectedPath);
        setPreview(null);
        setPreviewError(null);
        await analyzeFile(selectedPath);
      }
    } catch (err) {
      console.error("Failed to select file:", err);
      setPreviewError(t("import.errors.selectFile"));
    }
  };

  const analyzeFile = async (filePath: string) => {
    setIsAnalyzing(true);
    setPreviewError(null);

    try {
      const importEngine = new ImportEngine();
      const previewData = await importEngine.previewImport(filePath);
      setPreview(previewData);
    } catch (err) {
      console.error("Failed to analyze file:", err);
      setPreviewError(
        err instanceof Error ? err.message : t("import.errors.analyze")
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);
    setImportProgress(null);

    try {
      const importEngine = new ImportEngine((progressUpdate) => {
        setImportProgress(progressUpdate);
      });

      await importEngine.importArchive(selectedFile, conflictResolution);

      setImportSuccess(true);
      setImportProgress(null);

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      console.error("Import failed:", err);
      setImportError(
        err instanceof Error ? err.message : t("import.errors.unknown")
      );
      setImportProgress(null);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      // Reset all state
      setSelectedFile(null);
      setPreview(null);
      setPreviewError(null);
      setImportError(null);
      setImportSuccess(false);
      setImportProgress(null);
      setConflictResolution({ categories: "merge", documents: "merge" });
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getDialogTitle = () => {
    if (importSuccess) return t("import.dialog.successTitle");
    if (isImporting) return t("import.dialog.importingTitle");
    return t("import.dialog.title");
  };

  const getDialogVariant = () => {
    if (importError || previewError) return "danger" as const;
    if (importSuccess) return "success" as const;
    return "default" as const;
  };

  const conflictCount = preview?.conflicts.length || 0;
  const hasConflicts = conflictCount > 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={getDialogTitle()}
      description={t("import.dialog.description")}
      variant={getDialogVariant()}
      size="lg"
      showCloseButton={!isImporting}
      closeOnOverlayClick={!isImporting}
    >
      {/* File Selection */}
      {!selectedFile && !isAnalyzing && (
        <div className="text-center py-8">
          <DocumentArrowUpIcon className="h-16 w-16 mx-auto sage-text-mist mb-4" />
          <p className="sage-text-cream font-medium mb-4">
            {t("import.dialog.selectFilePrompt")}
          </p>
          <Button variant="primary" onClick={handleSelectFile}>
            <FolderIcon className="h-4 w-4 mr-2" />
            {t("import.dialog.selectFile")}
          </Button>
        </div>
      )}

      {/* Analyzing State */}
      {isAnalyzing && (
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-8 w-8 animate-spin sage-text-mist mr-3" />
          <p className="sage-text-cream">{t("import.dialog.analyzing")}</p>
        </div>
      )}

      {/* Preview Error */}
      {previewError && (
        <Card
          variant="ghost"
          padding="md"
          className="bg-red-900/20 border-red-500 mb-4"
        >
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-red-300 font-medium">
                {t("import.dialog.errorTitle")}
              </p>
              <p className="text-red-400 text-sm mt-1">{previewError}</p>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedFile(null);
                setPreviewError(null);
              }}
            >
              {t("import.dialog.selectDifferentFile")}
            </Button>
          </div>
        </Card>
      )}

      {/* Import Success */}
      {importSuccess && (
        <Card
          variant="ghost"
          padding="md"
          className="bg-green-900/20 border-green-500 mb-4"
        >
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-green-300 font-medium">
                {t("import.dialog.successMessage")}
              </p>
              <p className="text-green-400 text-sm mt-1">
                {t("import.dialog.importedFrom")}: {selectedFile}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Import Progress */}
      {isImporting && importProgress && (
        <Card variant="ghost" padding="md" className="mb-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="sage-text-cream font-medium">
                {importProgress.message}
              </p>
              <span className="sage-text-mist text-sm">
                {importProgress.progress}%
              </span>
            </div>

            <div className="w-full bg-sage-medium rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${importProgress.progress}%` }}
              />
            </div>

            {importProgress.currentItem && (
              <p className="sage-text-mist text-sm">
                {t("import.dialog.currentItem")}: {importProgress.currentItem}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Import Error */}
      {importError && (
        <Card
          variant="ghost"
          padding="md"
          className="bg-red-900/20 border-red-500 mb-4"
        >
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-red-300 font-medium">
                {t("import.dialog.importErrorTitle")}
              </p>
              <p className="text-red-400 text-sm mt-1">{importError}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Preview Content */}
      {preview && !isImporting && !importSuccess && (
        <div className="space-y-6">
          {/* Archive Info */}
          <div>
            <Label>{t("import.dialog.archiveInfo")}</Label>
            <Card variant="ghost" padding="md" className="sage-bg-medium">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="sage-text-cream font-medium">
                    {t("import.dialog.exportType")}
                  </span>
                  <span className="sage-text-mist">
                    {t(`import.types.${preview.metadata.exportType}`)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="sage-text-cream font-medium">
                    {t("import.dialog.exportDate")}
                  </span>
                  <span className="sage-text-mist">
                    {new Date(preview.metadata.exportDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="sage-text-cream font-medium">
                    {t("import.dialog.appVersion")}
                  </span>
                  <span className="sage-text-mist">
                    {preview.metadata.appVersion}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Import Summary */}
          <div>
            <Label>{t("import.dialog.importSummary")}</Label>
            <Card variant="ghost" padding="md" className="sage-bg-medium">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <FolderOpenIcon className="h-5 w-5 sage-text-gold" />
                  <div>
                    <p className="sage-text-cream font-medium">
                      {preview.summary.categories.length}
                    </p>
                    <p className="sage-text-mist text-sm">
                      {t("import.stats.documents")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <DocumentArrowUpIcon className="h-5 w-5 sage-text-gold" />
                  <div>
                    <p className="sage-text-cream font-medium">
                      {preview.summary.attachments}
                    </p>
                    <p className="sage-text-mist text-sm">
                      {t("import.stats.attachments")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded bg-sage-gold flex items-center justify-center">
                    <span className="text-xs text-gray-800 font-bold">~</span>
                  </div>
                  <div>
                    <p className="sage-text-cream font-medium">
                      {formatFileSize(preview.summary.estimatedSize)}
                    </p>
                    <p className="sage-text-mist text-sm">
                      {t("import.stats.estimatedSize")}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Conflicts Warning */}
          {hasConflicts && (
            <Card
              variant="ghost"
              padding="md"
              className="bg-yellow-900/20 border-yellow-500"
            >
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-yellow-300 font-medium">
                    {t("import.dialog.conflictsFound", {
                      count: conflictCount,
                    })}
                  </p>
                  <p className="text-yellow-400 text-sm mt-1">
                    {t("import.dialog.conflictsDescription")}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Conflict Resolution Settings */}
          {hasConflicts && (
            <div>
              <Label>{t("import.dialog.conflictResolution")}</Label>
              <div className="space-y-4">
                {/* Category Conflicts */}
                <div>
                  <label className="text-sm font-medium sage-text-cream mb-2 block">
                    {t("import.resolution.categories")}
                  </label>
                  <div className="space-y-2">
                    {(["skip", "merge", "replace"] as const).map((option) => (
                      <Card
                        key={option}
                        variant="ghost"
                        padding="sm"
                        className={`cursor-pointer transition-all ${
                          conflictResolution.categories === option
                            ? "sage-bg-gold border-sage-gold text-gray-800"
                            : "sage-bg-medium hover:sage-bg-light"
                        }`}
                        onClick={() =>
                          setConflictResolution((prev) => ({
                            ...prev,
                            categories: option,
                          }))
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className={`font-medium ${
                                conflictResolution.categories === option
                                  ? "text-gray-800"
                                  : "sage-text-cream"
                              }`}
                            >
                              {t(`import.resolution.${option}.title`)}
                            </p>
                            <p
                              className={`text-sm ${
                                conflictResolution.categories === option
                                  ? "text-gray-600"
                                  : "sage-text-mist"
                              }`}
                            >
                              {t(`import.resolution.${option}.description`)}
                            </p>
                          </div>
                          {conflictResolution.categories === option && (
                            <CheckCircleIcon className="h-5 w-5 text-gray-800" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Document Conflicts */}
                <div>
                  <label className="text-sm font-medium sage-text-cream mb-2 block">
                    {t("import.resolution.documents")}
                  </label>
                  <div className="space-y-2">
                    {(["skip", "merge", "replace"] as const).map((option) => (
                      <Card
                        key={option}
                        variant="ghost"
                        padding="sm"
                        className={`cursor-pointer transition-all ${
                          conflictResolution.documents === option
                            ? "sage-bg-gold border-sage-gold text-gray-800"
                            : "sage-bg-medium hover:sage-bg-light"
                        }`}
                        onClick={() =>
                          setConflictResolution((prev) => ({
                            ...prev,
                            documents: option,
                          }))
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className={`font-medium ${
                                conflictResolution.documents === option
                                  ? "text-gray-800"
                                  : "sage-text-cream"
                              }`}
                            >
                              {t(`import.resolution.${option}.title`)}
                            </p>
                            <p
                              className={`text-sm ${
                                conflictResolution.documents === option
                                  ? "text-gray-600"
                                  : "sage-text-mist"
                              }`}
                            >
                              {t(`import.resolution.${option}.description`)}
                            </p>
                          </div>
                          {conflictResolution.documents === option && (
                            <CheckCircleIcon className="h-5 w-5 text-gray-800" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Preview Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categories Preview */}
            {preview.summary.categories.length > 0 && (
              <div>
                <Label>{t("import.dialog.categoriesPreview")}</Label>
                <Card
                  variant="ghost"
                  padding="md"
                  className="sage-bg-medium max-h-40 overflow-y-auto"
                >
                  <div className="space-y-2">
                    {preview.summary.categories.map((category, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="sage-text-cream text-sm">
                          {category.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          {category.isNew ? (
                            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                              {t("import.status.new")}
                            </span>
                          ) : (
                            <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">
                              {t("import.status.exists")}
                            </span>
                          )}
                          {category.conflicts && (
                            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Documents Preview */}
            {preview.summary.documents.length > 0 && (
              <div>
                <Label>{t("import.dialog.documentsPreview")}</Label>
                <Card
                  variant="ghost"
                  padding="md"
                  className="sage-bg-medium max-h-40 overflow-y-auto"
                >
                  <div className="space-y-2">
                    {preview.summary.documents
                      .slice(0, 10)
                      .map((document, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="sage-text-cream text-sm font-medium truncate">
                              {document.title}
                            </span>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {document.isNew ? (
                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                  {t("import.status.new")}
                                </span>
                              ) : (
                                <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">
                                  {t("import.status.exists")}
                                </span>
                              )}
                              {document.conflicts && (
                                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />
                              )}
                            </div>
                          </div>
                          <p className="sage-text-mist text-xs">
                            {t("import.dialog.inCategory")}:{" "}
                            {document.categoryName}
                          </p>
                        </div>
                      ))}
                    {preview.summary.documents.length > 10 && (
                      <p className="sage-text-mist text-xs text-center pt-2">
                        {t("import.dialog.andMore", {
                          count: preview.summary.documents.length - 10,
                        })}
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isImporting && (
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={handleClose}>
            {importSuccess ? t("common.close") : t("common.cancel")}
          </Button>

          {selectedFile && !importSuccess && (
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedFile(null);
                setPreview(null);
                setPreviewError(null);
              }}
            >
              {t("import.dialog.selectDifferentFile")}
            </Button>
          )}

          {preview && !importSuccess && (
            <Button
              variant="primary"
              onClick={handleStartImport}
              disabled={isAnalyzing || !preview.canProceed}
            >
              <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
              {t("import.dialog.startImport")}
            </Button>
          )}
        </div>
      )}
    </Dialog>
  );
};

export default ImportDialog;
