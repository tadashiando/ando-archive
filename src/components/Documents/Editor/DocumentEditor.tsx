import React, { useEffect, useState } from "react";
import { writeFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { useEditor, EditorContent } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import StarterKit from "@tiptap/starter-kit";
import { db } from "../../../database";
import type { Category } from "../../../database";
import { Button, Input, Label } from "../../UI";
import Sidebar from "../../Layout/Sidebar";
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
  categories: Category[];
  onCategoryChange: (category: Category) => void;
  editingDocumentId?: number;
  mode?: "create" | "edit";
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  selectedCategory,
  onClose,
  onDocumentCreated,
  categories,
  onCategoryChange,
  editingDocumentId,
  mode = "create",
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === "edit" && editingDocumentId) {
      loadDocumentForEditing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDocumentId, mode]);

  const loadExistingAttachments = async (documentId: number) => {
    try {
      const existingAttachments = await db.getAttachments(documentId);

      // DEBUG: Ver o que vem do banco
      console.log("🔍 Anexos do banco:", existingAttachments);

      const attachmentFiles: AttachmentFile[] = existingAttachments.map(
        (att) => {
          console.log("📁 Processando anexo:", {
            filename: att.filename,
            filepath: att.filepath,
            filetype: att.filetype,
          });

          return {
            file: new File([], att.filename, { type: att.filetype }),
            type: getFileType(
              new File([], att.filename, { type: att.filetype })
            ),
            existingId: att.id,
            existingPath: att.filepath,
          };
        }
      );

      console.log("✅ Anexos processados:", attachmentFiles);

      setAttachments(attachmentFiles);
      if (attachmentFiles.length > 0) {
        setSelectedAttachment(attachmentFiles[0]);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar anexos existentes:", error);
    }
  };

  const loadDocumentForEditing = async () => {
    if (!editingDocumentId) return;

    setIsLoading(true);
    try {
      const document = await db.getDocumentById(editingDocumentId);
      if (document) {
        setTitle(document.title);
        if (editor) {
          editor.commands.setContent(document.text_content);
        }

        await loadExistingAttachments(editingDocumentId);
      }
    } catch (error) {
      console.error("Erro ao carregar documento para edição:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Editor TipTap
  const editor = useEditor({
    extensions: [StarterKit],
    content: `<p>${t("modal.createDocument.contentPlaceholder")}</p>`,
    editorProps: {
      attributes: {
        class:
          "sage-text-cream p-6 rounded-xl min-h-[400px] focus:outline-none prose prose-invert max-w-none prose-lg",
      },
    },
  });

  const processFile = (file: File): AttachmentFile => {
    const fileType = getFileType(file);
    const attachment: AttachmentFile = { file, type: fileType };

    // Gerar preview para imagens
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

      // Selecionar o primeiro anexo automaticamente
      if (attachments.length === 0 && newAttachments.length > 0) {
        setSelectedAttachment(newAttachments[0]);
      }
    }
  };

  const removeAttachment = (fileToRemove: File) => {
    setAttachments((prev) => {
      const filtered = prev.filter((att) => att.file !== fileToRemove);

      // Se removeu o selecionado, selecionar outro
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

      // Salvar apenas anexos novos (sem existingId)
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

      console.log(`Salvos anexos para documento ${documentId}`);
    } catch (error) {
      console.error("Erro ao salvar anexos:", error);
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
      onDocumentCreated();
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar Colapsável - Categorias */}
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        mode="editor"
        isCollapsible={true}
      />

      {/* Área Principal do Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header do Editor */}
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

        {/* Layout Principal - 2 Colunas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Coluna Esquerda - Editor */}
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
            {/* Título */}
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

            {/* Toolbar do Editor */}
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

            {/* Editor Principal */}
            <div className="flex-1 sage-bg-medium rounded-xl">
              <EditorContent editor={editor} className="h-full" />
            </div>
          </div>

          {/* Coluna Direita - Anexos e Preview */}
          <div className="w-96 sage-bg-dark border-l sage-border flex flex-col">
            {/* Header Anexos */}
            <AttachmentList
              attachments={attachments}
              selectedAttachment={selectedAttachment}
              onAttachmentSelect={setSelectedAttachment}
              onAttachmentRemove={removeAttachment}
              onFileUpload={handleFileUpload}
              isLoading={isLoading}
              mode="editor"
            />

            {/* Preview Area */}
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
