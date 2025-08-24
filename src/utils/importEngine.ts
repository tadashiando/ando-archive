// src/utils/importEngine.ts
import {
  readFile,
  exists,
  mkdir,
  copyFile,
  writeFile,
} from "@tauri-apps/plugin-fs";
import { appDataDir, dirname, join } from "@tauri-apps/api/path";
import JSZip from "jszip";
import { db } from "../database";
import type { Category, Document, Attachment } from "../database";

export interface ImportProgress {
  phase:
    | "reading"
    | "analyzing"
    | "importing-categories"
    | "importing-documents"
    | "copying-attachments"
    | "complete";
  progress: number; // 0-100
  currentItem?: string;
  message: string;
}

export interface ConflictResolution {
  categories: "skip" | "merge" | "replace";
  documents: "skip" | "merge" | "replace";
}

export interface ImportConflict {
  type: "category" | "document";
  existingItem: Category | Document;
  importItem: Category | Document;
  conflictReason: string;
}

export interface ImportPreview {
  metadata: ImportMetadata;
  summary: {
    categories: { name: string; isNew: boolean; conflicts?: string[] }[];
    documents: {
      title: string;
      categoryName: string;
      isNew: boolean;
      conflicts?: string[];
    }[];
    attachments: number;
    estimatedSize: number;
  };
  conflicts: ImportConflict[];
  canProceed: boolean;
}

export interface ImportMetadata {
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

export interface ImportData {
  metadata: ImportMetadata;
  categories: Category[];
  documents: Document[];
  attachments: ImportAttachment[];
}

export interface ImportAttachment extends Omit<Attachment, "id"> {
  exportPath: string;
  originalPath: string;
}

export interface ImportProgress {
  phase:
    | "reading"
    | "analyzing"
    | "importing-categories"
    | "importing-documents"
    | "copying-attachments"
    | "complete";
  progress: number; // 0-100
  currentItem?: string;
  message: string;
}

export interface ConflictResolution {
  categories: "skip" | "merge" | "replace";
  documents: "skip" | "merge" | "replace";
}

export interface ImportConflict {
  type: "category" | "document";
  existingItem: Category | Document;
  importItem: Category | Document;
  conflictReason: string;
}

export interface ImportPreview {
  metadata: ImportMetadata;
  summary: {
    categories: { name: string; isNew: boolean; conflicts?: string[] }[];
    documents: {
      title: string;
      categoryName: string;
      isNew: boolean;
      conflicts?: string[];
    }[];
    attachments: number;
    estimatedSize: number;
  };
  conflicts: ImportConflict[];
  canProceed: boolean;
}

export class ImportEngine {
  private onProgress?: (progress: ImportProgress) => void;

  constructor(onProgress?: (progress: ImportProgress) => void) {
    this.onProgress = onProgress;
  }

  private reportProgress(
    phase: ImportProgress["phase"],
    progress: number,
    message: string,
    currentItem?: string
  ) {
    if (this.onProgress) {
      this.onProgress({ phase, progress, message, currentItem });
    }
  }

  /**
   * Preview import file without actually importing
   */
  async previewImport(archivePath: string): Promise<ImportPreview> {
    this.reportProgress("reading", 10, "Reading archive file...");

    let tempDir: string | null = null;

    try {
      // Extract ZIP file to temp directory
      tempDir = await this.extractArchive(archivePath);

      this.reportProgress("analyzing", 30, "Analyzing import data...");

      // Read import data
      const importData = await this.readImportData(tempDir);

      this.reportProgress("analyzing", 60, "Checking for conflicts...");

      // Analyze conflicts
      const conflicts = await this.analyzeConflicts(importData);

      // Generate preview summary
      const summary = await this.generateImportSummary(importData, conflicts);

      this.reportProgress("analyzing", 100, "Analysis complete");

      return {
        metadata: importData.metadata,
        summary,
        conflicts,
        canProceed: true,
      };
    } catch (error) {
      console.error("Preview failed:", error);
      throw new Error(
        `Preview failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Cleanup temp directory after preview
      if (tempDir) {
        await this.cleanupTempDirectory(tempDir);
      }
    }
  }

  /**
   * Import archive with conflict resolution
   */
  async importArchive(
    archivePath: string,
    resolution: ConflictResolution
  ): Promise<void> {
    this.reportProgress("reading", 5, "Preparing import...");

    let tempDir: string | null = null;

    try {
      // Extract archive
      tempDir = await this.extractArchive(archivePath);

      this.reportProgress("reading", 15, "Reading import data...");

      // Read import data
      const importData = await this.readImportData(tempDir);

      this.reportProgress(
        "importing-categories",
        25,
        "Importing categories..."
      );

      // Import categories first (needed for documents)
      const categoryMapping = await this.importCategories(
        importData.categories,
        resolution.categories
      );

      this.reportProgress("importing-documents", 50, "Importing documents...");

      // Import documents with updated category IDs
      const documentMapping = await this.importDocuments(
        importData.documents,
        categoryMapping,
        resolution.documents
      );

      this.reportProgress(
        "copying-attachments",
        75,
        "Copying attachment files..."
      );

      // Import attachments with updated document IDs
      await this.importAttachments(
        importData.attachments,
        documentMapping,
        tempDir
      );

      this.reportProgress("complete", 100, "Import completed successfully!");
    } catch (error) {
      console.error("Import failed:", error);
      throw new Error(
        `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Cleanup temp directory
      if (tempDir) {
        await this.cleanupTempDirectory(tempDir);
      }
    }
  }

  /**
   * Extract archive file (placeholder for ZIP extraction)
   */
  private async extractArchive(archivePath: string): Promise<string> {
    try {
      // Read the ZIP file
      const zipData = await readFile(archivePath);

      // Load ZIP with JSZip
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipData);

      // Create temp directory
      const appDir = await appDataDir();
      const tempDir = await join(
        appDir,
        "ando-archive",
        "temp-import",
        `import-${Date.now()}`
      );
      await mkdir(tempDir, { recursive: true });

      // Extract all files
      const filePromises: Promise<void>[] = [];

      zipContent.forEach((relativePath, file) => {
        if (!file.dir) {
          // It's a file, extract it
          const extractFile = async () => {
            try {
              const content = await file.async("uint8array");
              const fullPath = await join(tempDir, relativePath);

              // Ensure directory exists
              const dir = await dirname(fullPath);
              await mkdir(dir, { recursive: true });

              // Write file
              await writeFile(fullPath, content);

              console.log(`Extracted: ${relativePath}`);
            } catch (error) {
              console.error(`Failed to extract ${relativePath}:`, error);
              throw error;
            }
          };

          filePromises.push(extractFile());
        }
      });

      // Wait for all files to be extracted
      await Promise.all(filePromises);

      console.log(`Successfully extracted ZIP to: ${tempDir}`);
      return tempDir;
    } catch (error) {
      console.error("ZIP extraction failed:", error);
      throw new Error(
        `Failed to extract archive: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Clean up temporary directory
   */
  private async cleanupTempDirectory(tempDir: string): Promise<void> {
    try {
      const dirExists = await exists(tempDir);
      if (dirExists) {
        // Note: Tauri doesn't have recursive directory removal in fs plugin
        // We'll leave cleanup for now, or implement manual recursive deletion
        console.log(`TODO: Cleanup temp directory: ${tempDir}`);
      }
    } catch (error) {
      console.warn("Failed to cleanup temp directory:", error);
      // Don't throw - cleanup is not critical
    }
  }

  /**
   * Read import data from extracted directory
   */
  private async readImportData(tempDir: string): Promise<ImportData> {
    const decoder = new TextDecoder();

    // Read metadata
    const metadataPath = await join(tempDir, "metadata.json");
    const metadataContent = await readFile(metadataPath);
    const metadata: ImportMetadata = JSON.parse(
      decoder.decode(metadataContent)
    );

    // Read categories
    const categoriesPath = await join(tempDir, "categories.json");
    const categoriesContent = await readFile(categoriesPath);
    const categories: Category[] = JSON.parse(
      decoder.decode(categoriesContent)
    );

    // Read documents
    const documentsPath = await join(tempDir, "documents.json");
    const documentsContent = await readFile(documentsPath);
    const documents: Document[] = JSON.parse(decoder.decode(documentsContent));

    // Read attachments
    const attachmentsPath = await join(tempDir, "attachments.json");
    const attachmentsContent = await readFile(attachmentsPath);
    const attachments: ImportAttachment[] = JSON.parse(
      decoder.decode(attachmentsContent)
    );

    return { metadata, categories, documents, attachments };
  }

  /**
   * Analyze potential conflicts with existing data
   */
  private async analyzeConflicts(
    importData: ImportData
  ): Promise<ImportConflict[]> {
    const conflicts: ImportConflict[] = [];

    // Check for existing categories with same names
    const existingCategories = await db.getCategories();

    for (const importCategory of importData.categories) {
      const existingCategory = existingCategories.find(
        (cat) => cat.name.toLowerCase() === importCategory.name.toLowerCase()
      );

      if (existingCategory) {
        conflicts.push({
          type: "category",
          existingItem: existingCategory,
          importItem: importCategory,
          conflictReason: "Category with same name already exists",
        });
      }
    }

    // Check for existing documents with same titles in same categories
    for (const importDocument of importData.documents) {
      // Find the corresponding category (either existing or being imported)
      let targetCategoryId = importDocument.category_id;

      // If category is being imported, we need to find potential existing category
      const importCategory = importData.categories.find(
        (cat) => cat.id === importDocument.category_id
      );
      if (importCategory) {
        const existingCategory = existingCategories.find(
          (cat) => cat.name.toLowerCase() === importCategory.name.toLowerCase()
        );
        if (existingCategory) {
          targetCategoryId = existingCategory.id;
        }
      }

      // Check for existing documents in the target category
      const existingDocs = await db.getDocumentsByCategory(targetCategoryId);
      const existingDoc = existingDocs.find(
        (doc) => doc.title.toLowerCase() === importDocument.title.toLowerCase()
      );

      if (existingDoc) {
        conflicts.push({
          type: "document",
          existingItem: existingDoc,
          importItem: importDocument,
          conflictReason: "Document with same title already exists in category",
        });
      }
    }

    return conflicts;
  }

  /**
   * Generate import summary for preview
   */
  private async generateImportSummary(
    importData: ImportData,
    conflicts: ImportConflict[]
  ): Promise<ImportPreview["summary"]> {
    const existingCategories = await db.getCategories();

    // Analyze categories
    const categories = importData.categories.map((importCat) => {
      const isNew = !existingCategories.some(
        (cat) => cat.name.toLowerCase() === importCat.name.toLowerCase()
      );
      const categoryConflicts = conflicts
        .filter(
          (c) => c.type === "category" && c.importItem.id === importCat.id
        )
        .map((c) => c.conflictReason);

      return {
        name: importCat.name,
        isNew,
        ...(categoryConflicts.length > 0 && { conflicts: categoryConflicts }),
      };
    });

    // Analyze documents
    const documents = importData.documents.map((importDoc) => {
      const importCategory = importData.categories.find(
        (cat) => cat.id === importDoc.category_id
      );
      const documentConflicts = conflicts
        .filter(
          (c) => c.type === "document" && c.importItem.id === importDoc.id
        )
        .map((c) => c.conflictReason);

      // Determine if document is new (no conflicts)
      const isNew = documentConflicts.length === 0;

      return {
        title: importDoc.title,
        categoryName: importCategory?.name || "Unknown Category",
        isNew,
        ...(documentConflicts.length > 0 && { conflicts: documentConflicts }),
      };
    });

    // Calculate estimated size
    const estimatedSize = importData.attachments.reduce(
      (sum, att) => sum + (att.filesize || 0),
      0
    );

    return {
      categories,
      documents,
      attachments: importData.attachments.length,
      estimatedSize,
    };
  }

  /**
   * Import categories with conflict resolution
   */
  private async importCategories(
    importCategories: Category[],
    resolution: ConflictResolution["categories"]
  ): Promise<Map<number, number>> {
    const categoryMapping = new Map<number, number>(); // oldId -> newId
    const existingCategories = await db.getCategories();

    for (const importCategory of importCategories) {
      let finalCategoryId: number;

      // Check if category already exists
      const existingCategory = existingCategories.find(
        (cat) => cat.name.toLowerCase() === importCategory.name.toLowerCase()
      );

      if (existingCategory) {
        // Handle conflict based on resolution
        switch (resolution) {
          case "skip":
            finalCategoryId = existingCategory.id;
            break;

          case "merge":
            // Update existing category with new properties but keep same ID
            await db.updateCategory(
              existingCategory.id,
              importCategory.name, // Use import name (might have different case)
              importCategory.icon,
              importCategory.color
            );
            finalCategoryId = existingCategory.id;
            break;

          case "replace":
            // Update existing category completely
            await db.updateCategory(
              existingCategory.id,
              importCategory.name,
              importCategory.icon,
              importCategory.color
            );
            finalCategoryId = existingCategory.id;
            break;
        }
      } else {
        // Category doesn't exist, create new one
        const newCategory = await db.createCategory(
          importCategory.name,
          importCategory.icon,
          importCategory.color
        );
        finalCategoryId = newCategory.id;
      }

      categoryMapping.set(importCategory.id, finalCategoryId);
    }

    return categoryMapping;
  }

  /**
   * Import documents with updated category IDs
   */
  private async importDocuments(
    importDocuments: Document[],
    categoryMapping: Map<number, number>,
    resolution: ConflictResolution["documents"]
  ): Promise<Map<number, number>> {
    const documentMapping = new Map<number, number>(); // oldId -> newId

    for (const importDocument of importDocuments) {
      let finalDocumentId: number;

      // Get the new category ID from mapping
      const newCategoryId = categoryMapping.get(importDocument.category_id);
      if (!newCategoryId) {
        console.warn(
          `No category mapping found for document ${importDocument.title}`
        );
        continue;
      }

      // Check if document already exists in the target category
      const existingDocs = await db.getDocumentsByCategory(newCategoryId);
      const existingDocument = existingDocs.find(
        (doc) => doc.title.toLowerCase() === importDocument.title.toLowerCase()
      );

      if (existingDocument) {
        // Handle conflict based on resolution
        switch (resolution) {
          case "skip":
            finalDocumentId = existingDocument.id;
            break;

          case "merge":
          case "replace": {
            // Update existing document
            const updatedDoc = await db.updateDocument(
              existingDocument.id,
              importDocument.title,
              importDocument.description,
              importDocument.text_content
            );
            finalDocumentId = updatedDoc.id;
            break;
          }
        }
      } else {
        // Document doesn't exist, create new one
        const newDocument = await db.createDocument(
          importDocument.title,
          importDocument.description,
          importDocument.text_content,
          newCategoryId
        );
        finalDocumentId = newDocument.id;
      }

      documentMapping.set(importDocument.id, finalDocumentId);
    }

    return documentMapping;
  }

  /**
   * Import attachments with updated document IDs
   */
  private async importAttachments(
    importAttachments: ImportAttachment[],
    documentMapping: Map<number, number>,
    tempDir: string
  ): Promise<void> {
    let copiedCount = 0;

    for (const importAttachment of importAttachments) {
      try {
        // Get the new document ID from mapping
        const newDocumentId = documentMapping.get(importAttachment.document_id);
        if (!newDocumentId) {
          console.warn(
            `No document mapping found for attachment ${importAttachment.filename}`
          );
          continue;
        }

        // Source path in extracted archive
        const sourcePath = await join(tempDir, importAttachment.exportPath);

        // Check if source file exists
        const sourceExists = await exists(sourcePath);
        if (!sourceExists) {
          console.warn(`Attachment file not found: ${sourcePath}`);
          continue;
        }

        // Create destination path in app data
        const appDir = await appDataDir();
        const attachmentsDir = await join(
          appDir,
          "ando-archive",
          "attachments",
          newDocumentId.toString()
        );
        await mkdir(attachmentsDir, { recursive: true });

        const destPath = await join(attachmentsDir, importAttachment.filename);

        // Copy file to destination
        await copyFile(sourcePath, destPath);

        // Add attachment record to database
        await db.addAttachment(
          newDocumentId,
          importAttachment.filename,
          destPath,
          importAttachment.filetype,
          importAttachment.filesize
        );

        copiedCount++;
        const progress =
          75 + Math.floor((copiedCount / importAttachments.length) * 20);
        this.reportProgress(
          "copying-attachments",
          progress,
          `Copying attachments (${copiedCount}/${importAttachments.length})...`,
          importAttachment.filename
        );
      } catch (error) {
        console.error(
          `Failed to import attachment ${importAttachment.filename}:`,
          error
        );
        // Continue with other attachments
      }
    }
  }
}
