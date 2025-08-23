import React, { useEffect, useState } from "react";
import { writeFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { useEditor, EditorContent } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import StarterKit from "@tiptap/starter-kit";
import { db } from "../../../database";
import type { Category } from "../../../database";
import { Button, Input, Label } from "../../UI";
import Header from "../../Layout/Header";
import AttachmentPreview from "./AttachmentPreview";
import AttachmentList from "./AttachmentList";

interface AttachmentFile {
  file: File;
  preview?: string;
  type: "image" | "video" | "pdf" | "other";
  existingId?: number;
  existingPath?: string;
}

interface DocumentEditorProps {
  selectedCategory: Category;
  onClose: () => void;
  onDocumentCreated: () => void;
  onContentChange?: (hasChanges: boolean) => void;
  editingDocumentId?: number;
  mode?: "create" | "edit";
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  selectedCategory,
  onClose,
  onDocumentCreated,
  onContentChange,
  editingDocumentId,
  mode = "create",
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialTitle, setInitialTitle] = useState("");
  const [initialContent, setInitialContent] = useState("");

  useEffect(() => {
    if (mode === "edit" && editingDocumentId) {
      loadDocumentForEditing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDocumentId, mode]);

  // Track changes for unsaved content detection
  useEffect(() => {
    const hasChanges =
      title !== initialTitle || (editor?.getHTML() || "") !== initialContent;

    if (onContentChange) {
      onContentChange(hasChanges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, initialTitle, initialContent, onContentChange]);

  const loadExistingAttachments = async (documentId: number) => {
    try {
      const existingAttachments = await db.getAttachments(documentId);

      const attachmentFiles: AttachmentFile[] = existingAttachments.map(
        (att) => ({
          file: new File([], att.filename, { type: att.filetype }),
          type: getFileType(new File([], att.filename, { type: att.filetype })),
          existingId: att.id,
          existingPath: att.filepath,
        })
      );

      setAttachments(attachmentFiles);
      if (attachmentFiles.length > 0) {
        setSelectedAttachment(attachmentFiles[0]);
      }
    } catch (error) {
      console.error("Error loading existing attachments:", error);
    }
  };

  const loadDocumentForEditing = async () => {
    if (!editingDocumentId) return;

    setIsLoading(true);
    try {
      const document = await db.getDocumentById(editingDocumentId);
      if (document) {
        setTitle(document.title);
        setInitialTitle(document.title);
        setInitialContent(document.text_content);

        if (editor) {
          editor.commands.setContent(document.text_content);
        }

        await loadExistingAttachments(editingDocumentId);
      }
    } catch (error) {
      console.error("Error loading document for editing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Editor TipTap with change tracking
  const editor = useEditor({
    extensions: [StarterKit],
    content: `<p>${t("modal.createDocument.contentPlaceholder")}</p>`,
    editorProps: {
      attributes: {
        class:
          "sage-text-cream p-6 rounded-xl min-h-[400px] focus:outline-none prose prose-invert max-w-none prose-lg",
      },
    },
    onUpdate: () => {
      // Trigger change detection when content changes
      const hasChanges =
        title !== initialTitle || (editor?.getHTML() || "") !== initialContent;

      if (onContentChange) {
        onContentChange(hasChanges);
      }
    },
  });

  const processFile = (file: File): AttachmentFile => {
    const fileType = getFileType(file);
    const attachment: AttachmentFile = { file, type: fileType };

    if (fileType === "image") {
      const reader = new FileReader();
      reader.onload = (e) => {
        attachment.preview = e.target?.result as string;
        setAttachments((prev) =>
          prev.map((att) => (att.file === file ? { ...attachment } : att))
        );
      };
      reader.readAsDataURL(file);
    }

    return attachment;
  };

  const getFileType = (file: File): "image" | "video" | "pdf" | "other" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type === "application/pdf") return "pdf";
    return "other";
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments = Array.from(files).map(processFile);
      setAttachments((prev) => [...prev, ...newAttachments]);

      if (attachments.length === 0 && newAttachments.length > 0) {
        setSelectedAttachment(newAttachments[0]);
      }
    }
  };

  const removeAttachment = (fileToRemove: File) => {
    setAttachments((prev) => {
      const filtered = prev.filter((att) => att.file !== fileToRemove);

      if (selectedAttachment?.file === fileToRemove) {
        setSelectedAttachment(filtered.length > 0 ? filtered[0] : null);
      }

      return filtered;
    });
  };

  const saveAttachmentFiles = async (documentId: number) => {
    if (attachments.length === 0) return;

    try {
      const appDir = await appDataDir();
      const attachmentsDir = await join(
        appDir,
        "ando-archive",
        "attachments",
        documentId.toString()
      );

      if (!(await exists(attachmentsDir))) {
        await mkdir(attachmentsDir, { recursive: true });
      }

      for (const attachment of attachments) {
        if (!attachment.existingId) {
          const { file } = attachment;
          const fileName = `${Date.now()}_${file.name}`;
          const filePath = `${attachmentsDir}/${fileName}`;

          const arrayBuffer = await file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          await writeFile(filePath, uint8Array);
          await db.addAttachment(
            documentId,
            file.name,
            filePath,
            file.type,
            file.size
          );
        }
      }
    } catch (error) {
      console.error("Error saving attachments:", error);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !editor) return;

    setIsLoading(true);
    try {
      const textContent = editor.getHTML();
      let documentId: number;

      if (mode === "edit" && editingDocumentId) {
        await db.updateDocument(
          editingDocumentId,
          title.trim(),
          "",
          textContent
        );
        documentId = editingDocumentId;
      } else {
        const newDocument = await db.createDocument(
          title.trim(),
          "",
          textContent,
          selectedCategory.id
        );
        documentId = newDocument.id;
      }

      await saveAttachmentFiles(documentId);

      // Reset change tracking
      setInitialTitle(title);
      setInitialContent(textContent);
      if (onContentChange) {
        onContentChange(false);
      }

      onDocumentCreated();
    } catch (error) {
      console.error("Error saving document:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col">
        <Header
          mode="editor"
          editorTitle={
            mode === "edit"
              ? t("documents.edit")
              : t("modal.createDocument.title")
          }
          editorSubtitle={t("modal.createDocument.subtitle", {
            category: selectedCategory.name,
          })}
          onCloseClick={onClose}
          onSaveClick={handleSubmit}
          saveButtonDisabled={isLoading || !title.trim()}
          saveButtonText={
            isLoading
              ? mode === "edit"
                ? "Salvando..."
                : t("modal.createDocument.creating")
              : mode === "edit"
              ? t("common.save")
              : t("modal.createDocument.create")
          }
          isLoading={isLoading}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
            <div>
              <Label required>{t("modal.createDocument.titleField")}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("modal.createDocument.titlePlaceholder")}
                inputSize="lg"
                required
                disabled={isLoading}
                className="text-xl font-bold"
              />
            </div>

            {editor && (
              <div className="flex items-center space-x-2 p-3 sage-bg-light rounded-xl">
                <Button
                  type="button"
                  variant={editor.isActive("bold") ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  disabled={isLoading}
                >
                  {t("editor.bold")}
                </Button>
                <Button
                  type="button"
                  variant={editor.isActive("italic") ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  disabled={isLoading}
                >
                  {t("editor.italic")}
                </Button>
                <Button
                  type="button"
                  variant={
                    editor.isActive("heading", { level: 2 })
                      ? "primary"
                      : "ghost"
                  }
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  disabled={isLoading}
                >
                  {t("editor.heading")}
                </Button>
                <Button
                  type="button"
                  variant={editor.isActive("bulletList") ? "primary" : "ghost"}
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  disabled={isLoading}
                >
                  {t("editor.bulletList")}
                </Button>
              </div>
            )}

            <div className="flex-1 sage-bg-medium rounded-xl">
              <EditorContent editor={editor} className="h-full" />
            </div>
          </div>

          <div className="w-96 sage-bg-dark border-l sage-border flex flex-col">
            <AttachmentList
              attachments={attachments}
              selectedAttachment={selectedAttachment}
              onAttachmentSelect={setSelectedAttachment}
              onAttachmentRemove={removeAttachment}
              onAttachmentDeleted={() => {
                if (editingDocumentId) {
                  loadExistingAttachments(editingDocumentId);
                }
              }}
              onSelectionClear={() => setSelectedAttachment(null)}
              onFileUpload={handleFileUpload}
              isLoading={isLoading}
              mode="editor"
            />

            <div className="flex-1 p-4">
              <div className="h-full sage-bg-medium rounded-xl p-4">
                <AttachmentPreview attachment={selectedAttachment} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
