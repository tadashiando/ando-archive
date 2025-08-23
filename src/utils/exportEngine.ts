import { writeFile, exists, mkdir, copyFile } from "@tauri-apps/plugin-fs";
import { appDataDir, join, dirname } from "@tauri-apps/api/path";
import { db } from "../database";
import type { Category, Document, Attachment } from "../database";

interface ExportMetadata {
  version: string;
  exportDate: string;
  totalCategories: number;
  totalDocuments: number;
  totalAttachments: number;
  appVersion: string;
  exportType: "complete" | "category" | "document";
  categoryId?: number;
  documentId?: number;
}

interface ExportData {
  metadata: ExportMetadata;
  categories: Category[];
  documents: Document[];
  attachments: Attachment[];
}

interface ExportProgress {
  phase: "collecting" | "copying-attachments" | "creating-archive" | "complete";
  progress: number; // 0-100
  currentItem?: string;
  message: string;
}

export interface ExportOptions {
  type: "complete" | "category" | "document";
  categoryId?: number;
  documentId?: number;
}

export class ExportEngine {
  private onProgress?: (progress: ExportProgress) => void;

  constructor(onProgress?: (progress: ExportProgress) => void) {
    this.onProgress = onProgress;
  }

  private reportProgress(
    phase: ExportProgress["phase"],
    progress: number,
    message: string,
    currentItem?: string
  ) {
    if (this.onProgress) {
      this.onProgress({ phase, progress, message, currentItem });
    }
  }

  async exportArchive(
    exportPath: string,
    options: ExportOptions = { type: "complete" }
  ): Promise<void> {
    try {
      this.reportProgress("collecting", 10, "Collecting data...");

      // 1. Collect data based on selection type
      const exportData = await this.collectSelectiveExportData(options);

      this.reportProgress(
        "collecting",
        30,
        `${this.getCollectionMessage(options)} collected successfully`
      );

      // 2. Create temporary export directory
      const tempDir = await this.createTempExportDirectory();

      this.reportProgress(
        "copying-attachments",
        40,
        "Copying attachment files..."
      );

      // 3. Copy attachment files
      await this.copyAttachmentFiles(exportData.attachments, tempDir);

      this.reportProgress(
        "copying-attachments",
        70,
        "Attachments copied successfully"
      );

      // 4. Write export files with selection context
      await this.writeSelectiveExportFiles(exportData, tempDir, options);

      this.reportProgress("creating-archive", 80, "Creating archive file...");

      // 5. Create final archive
      await this.createArchive(tempDir, exportPath);

      this.reportProgress(
        "complete",
        100,
        `${this.getCompletionMessage(options)} exported successfully!`
      );
    } catch (error) {
      console.error("Export failed:", error);
      throw new Error(
        `Export failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Collect data based on export options
   */
  private async collectSelectiveExportData(
    options: ExportOptions
  ): Promise<ExportData> {
    let categories: Category[] = [];
    let documents: Document[] = [];
    let attachments: Attachment[] = [];

    switch (options.type) {
      case "complete":
        // Original complete export logic
        categories = await db.getCategories();
        for (const category of categories) {
          const categoryDocs = await db.getDocumentsByCategory(category.id);
          documents.push(...categoryDocs);

          for (const doc of categoryDocs) {
            const docAttachments = await db.getAttachments(doc.id);
            attachments.push(...docAttachments);
          }
        }
        break;

      case "category": {
        if (!options.categoryId)
          throw new Error("Category ID required for category export");

        // Get specific category
        const allCategories = await db.getCategories();
        const targetCategory = allCategories.find(
          (cat) => cat.id === options.categoryId
        );
        if (!targetCategory) throw new Error("Category not found");

        categories = [targetCategory];
        documents = await db.getDocumentsByCategory(options.categoryId);

        for (const doc of documents) {
          const docAttachments = await db.getAttachments(doc.id);
          attachments.push(...docAttachments);
        }
        break;
      }

      case "document": {
        if (!options.documentId)
          throw new Error("Document ID required for document export");

        // Get specific document and its category
        const document = await db.getDocumentById(options.documentId);
        if (!document) throw new Error("Document not found");

        documents = [document];
        attachments = await db.getAttachments(options.documentId);

        // Include the document's category
        const allCategoriesForDoc = await db.getCategories();
        const docCategory = allCategoriesForDoc.find(
          (cat) => cat.id === document.category_id
        );
        if (docCategory) {
          categories = [docCategory];
        }
        break;
      }
    }

    const metadata: ExportMetadata = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      totalCategories: categories.length,
      totalDocuments: documents.length,
      totalAttachments: attachments.length,
      appVersion: "0.1.0",
      exportType: options.type, // FIXED: Now properly typed
      ...(options.categoryId && { categoryId: options.categoryId }),
      ...(options.documentId && { documentId: options.documentId }),
    };

    return { metadata, categories, documents, attachments };
  }

  /**
   * Create temporary directory for export
   */
  private async createTempExportDirectory(): Promise<string> {
    const appDir = await appDataDir();
    const tempDir = await join(
      appDir,
      "ando-archive",
      "temp-export",
      `export-${Date.now()}`
    );

    await mkdir(tempDir, { recursive: true });

    // Create subdirectories
    await mkdir(await join(tempDir, "attachments"), { recursive: true });

    return tempDir;
  }

  /**
   * Copy all attachment files to export directory
   */
  private async copyAttachmentFiles(
    attachments: Attachment[],
    tempDir: string
  ): Promise<void> {
    const attachmentsDir = await join(tempDir, "attachments");
    let copiedCount = 0;

    for (const attachment of attachments) {
      try {
        // Check if source file exists
        const sourceExists = await exists(attachment.filepath);
        if (!sourceExists) {
          console.warn(`Attachment file not found: ${attachment.filepath}`);
          continue;
        }

        // Create destination path maintaining document structure
        const relativePath = `doc-${attachment.document_id}/${attachment.filename}`;
        const destPath = await join(attachmentsDir, relativePath);
        const destDir = await dirname(destPath);

        // Ensure destination directory exists
        await mkdir(destDir, { recursive: true });

        // Copy file
        await copyFile(attachment.filepath, destPath);

        copiedCount++;
        const progress =
          40 + Math.floor((copiedCount / attachments.length) * 30);
        this.reportProgress(
          "copying-attachments",
          progress,
          `Copying attachments (${copiedCount}/${attachments.length})...`,
          attachment.filename
        );
      } catch (error) {
        console.error(
          `Failed to copy attachment ${attachment.filename}:`,
          error
        );
        // Continue with other attachments instead of failing completely
      }
    }
  }

  /**
   * Write export files with selection context
   */
  private async writeSelectiveExportFiles(
    exportData: ExportData,
    tempDir: string,
    options: ExportOptions
  ): Promise<void> {
    const encoder = new TextEncoder();

    // Write metadata
    const metadataPath = await join(tempDir, "metadata.json");
    const metadataJson = JSON.stringify(exportData.metadata, null, 2);
    await writeFile(metadataPath, encoder.encode(metadataJson));

    // Write categories
    const categoriesPath = await join(tempDir, "categories.json");
    const categoriesJson = JSON.stringify(exportData.categories, null, 2);
    await writeFile(categoriesPath, encoder.encode(categoriesJson));

    // Write documents
    const documentsPath = await join(tempDir, "documents.json");
    const documentsJson = JSON.stringify(exportData.documents, null, 2);
    await writeFile(documentsPath, encoder.encode(documentsJson));

    // Write attachments index (with updated paths)
    const attachmentsIndex = exportData.attachments.map((att) => ({
      ...att,
      // Update filepath to relative path in export
      exportPath: `attachments/doc-${att.document_id}/${att.filename}`,
      originalPath: att.filepath, // Keep reference to original
    }));

    const attachmentsPath = await join(tempDir, "attachments.json");
    const attachmentsJson = JSON.stringify(attachmentsIndex, null, 2);
    await writeFile(attachmentsPath, encoder.encode(attachmentsJson));

    // NEW: Add selection context file
    const contextPath = await join(tempDir, "export-context.json");
    const contextData = {
      exportType: options.type,
      timestamp: new Date().toISOString(),
      selection: {
        ...(options.categoryId && { categoryId: options.categoryId }),
        ...(options.documentId && { documentId: options.documentId }),
      },
      summary: {
        categories: exportData.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
        })),
        documents: exportData.documents.map((doc) => ({
          id: doc.id,
          title: doc.title,
          category_id: doc.category_id,
        })),
        attachmentCount: exportData.attachments.length,
      },
    };

    await writeFile(
      contextPath,
      encoder.encode(JSON.stringify(contextData, null, 2))
    );
  }

  /**
   * Create final ZIP archive
   * Note: This is a placeholder. For production, use JSZip
   */
  private async createArchive(
    sourceDir: string,
    exportPath: string
  ): Promise<void> {
    // TODO: Implement actual ZIP compression with JSZip
    // For now, we'll just copy the directory structure

    console.log(
      `Archive creation from ${sourceDir} to ${exportPath} - TODO: Implement ZIP`
    );

    // Real implementation would:
    // 1. Use JSZip to create proper ZIP file
    // 2. Add all files from sourceDir
    // 3. Write to exportPath
  }

  /**
   * Get selective export statistics
   */
  async getSelectiveExportStats(options: ExportOptions): Promise<{
    categories: number;
    documents: number;
    attachments: number;
    estimatedSize: number;
    selectionInfo?: string;
  }> {
    let categories = 0;
    let documents = 0;
    let attachments = 0;
    let estimatedSize = 0;
    let selectionInfo = "";

    switch (options.type) {
      case "complete": {
        const stats = await this.getExportStats();
        return { ...stats, selectionInfo: "Complete Archive" };
      }

      case "category": {
        if (!options.categoryId) break;

        const categoryDocs = await db.getDocumentsByCategory(
          options.categoryId
        );
        const categoryData = await db.getCategories();
        const category = categoryData.find(
          (cat) => cat.id === options.categoryId
        );

        categories = 1;
        documents = categoryDocs.length;
        selectionInfo = `Category: ${category?.name || "Unknown"}`;

        for (const doc of categoryDocs) {
          const docAttachments = await db.getAttachments(doc.id);
          attachments += docAttachments.length;
          estimatedSize += docAttachments.reduce(
            (sum, att) => sum + att.filesize,
            0
          );
        }
        break;
      }

      case "document": {
        if (!options.documentId) break;

        const document = await db.getDocumentById(options.documentId);
        const docAttachments = await db.getAttachments(options.documentId);

        categories = 1; // Document's category will be included
        documents = 1;
        attachments = docAttachments.length;
        estimatedSize = docAttachments.reduce(
          (sum, att) => sum + att.filesize,
          0
        );
        selectionInfo = `Document: ${document?.title || "Unknown"}`;
        break;
      }
    }

    return {
      categories,
      documents,
      attachments,
      estimatedSize,
      selectionInfo,
    };
  }

  /**
   * Get export statistics (for backward compatibility)
   */
  async getExportStats(): Promise<{
    categories: number;
    documents: number;
    attachments: number;
    estimatedSize: number;
  }> {
    const categories = await db.getCategories();
    let documentCount = 0;
    let attachmentCount = 0;
    let estimatedSize = 0;

    for (const category of categories) {
      const docs = await db.getDocumentsByCategory(category.id);
      documentCount += docs.length;

      for (const doc of docs) {
        const attachments = await db.getAttachments(doc.id);
        attachmentCount += attachments.length;

        // Estimate size from attachment filesizes
        estimatedSize += attachments.reduce(
          (sum, att) => sum + att.filesize,
          0
        );
      }
    }

    return {
      categories: categories.length,
      documents: documentCount,
      attachments: attachmentCount,
      estimatedSize, // in bytes
    };
  }

  // Helper methods for messages
  private getCollectionMessage(options: ExportOptions): string {
    switch (options.type) {
      case "category":
        return "Category data";
      case "document":
        return "Document data";
      default:
        return "Database data";
    }
  }

  private getCompletionMessage(options: ExportOptions): string {
    switch (options.type) {
      case "category":
        return "Category";
      case "document":
        return "Document";
      default:
        return "Archive";
    }
  }
}
