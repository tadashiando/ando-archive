import React, { useState } from "react";
import {
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon,
  DocumentIcon,
  VideoCameraIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useEditor, EditorContent } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import StarterKit from "@tiptap/starter-kit";
import { db } from "../../database";
import type { Category } from "../../database";
import { Button, Input, Label, Card, Badge, IconButton } from "../UI";
import Sidebar from "../Layout/Sidebar";
import Header from "../Layout/Header";

interface AttachmentFile {
  file: File;
  preview?: string;
  type: "image" | "video" | "pdf" | "other";
}

interface DocumentEditorProps {
  selectedCategory: Category;
  onClose: () => void;
  onDocumentCreated: () => void;
  categories: Category[];
  onCategoryChange: (category: Category) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  selectedCategory,
  onClose,
  onDocumentCreated,
  categories,
  onCategoryChange,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
          prev.map((att) => (att.file === file ? attachment : att))
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

  const renderPreview = () => {
    if (!selectedAttachment) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl mb-4 block">📎</span>
            <p className="sage-text-mist">
              {t("modal.createDocument.attachmentsPlaceholder")}
            </p>
          </div>
        </div>
      );
    }

    const { file, preview, type } = selectedAttachment;

    switch (type) {
      case "image":
        return preview ? (
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-contain rounded-xl"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="sage-text-mist">{t("common.loading")}</span>
          </div>
        );

      case "video":
        return (
          <video
            controls
            className="w-full h-full rounded-xl"
            src={URL.createObjectURL(file)}
          >
            {t("common.browserNotSupported")}
          </video>
        );

      case "pdf":
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <DocumentIcon className="h-16 w-16 mx-auto sage-text-mist mb-4" />
              <p className="sage-text-cream font-bold">{file.name}</p>
              <p className="sage-text-mist text-sm">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => {
                  const url = URL.createObjectURL(file);
                  window.open(url, "_blank");
                }}
              >
                {t("common.openPdf")}
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <DocumentTextIcon className="h-16 w-16 mx-auto sage-text-mist mb-4" />
              <p className="sage-text-cream font-bold">{file.name}</p>
              <p className="sage-text-mist text-sm">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        );
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !editor) return;

    setIsLoading(true);
    try {
      const textContent = editor.getHTML();
      await db.createDocument(
        title.trim(),
        "", // Sem descrição
        textContent,
        selectedCategory.id
      );

      // TODO: Salvar anexos
      console.log("Anexos para salvar:", attachments);

      onDocumentCreated();
    } catch (error) {
      console.error("Erro ao criar documento:", error);
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
        {/* Header do Editor */}
        <Header
          mode="editor"
          editorTitle={t("modal.createDocument.title")}
          editorSubtitle={t("modal.createDocument.subtitle", {
            category: selectedCategory.name,
          })}
          onCloseClick={onClose}
          onSaveClick={handleSubmit}
          saveButtonDisabled={isLoading || !title.trim()}
          saveButtonText={
            isLoading
              ? t("modal.createDocument.creating")
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
            <div className="p-4 border-b sage-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold sage-text-cream">
                  {t("modal.createDocument.attachmentsField")}
                </h3>
                <div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
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
              </div>

              {/* Lista de Anexos */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {attachments.map((attachment, index) => (
                  <Card
                    key={index}
                    variant="ghost"
                    padding="sm"
                    className={`cursor-pointer transition-colors ${
                      selectedAttachment?.file === attachment.file
                        ? "sage-bg-light border-sage-gold"
                        : "hover:sage-bg-medium"
                    }`}
                    onClick={() => setSelectedAttachment(attachment)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={getBadgeVariant(attachment.type)}
                          size="sm"
                        >
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
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(attachment.file);
                        }}
                        icon={<XMarkIcon className="h-4 w-4" />}
                        disabled={isLoading}
                        label={t("common.delete")}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 p-4">
              <div className="h-full sage-bg-medium rounded-xl p-4">
                {renderPreview()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
