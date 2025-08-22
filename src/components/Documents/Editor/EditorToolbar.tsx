import React from "react";
import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { Button } from "../../UI";

interface EditorToolbarProps {
  editor: Editor | null;
  isLoading?: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  if (!editor) {
    return null;
  }

  return (
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
        variant={editor.isActive("heading", { level: 2 }) ? "primary" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={isLoading}
      >
        {t("editor.heading")}
      </Button>

      <Button
        type="button"
        variant={editor.isActive("bulletList") ? "primary" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={isLoading}
      >
        {t("editor.bulletList")}
      </Button>
    </div>
  );
};

export default EditorToolbar;
