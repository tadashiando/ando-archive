import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { Card } from "../../UI";

interface EnhancedTipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onContentChange?: (hasChanges: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  initialContent?: string;
}

const EnhancedTipTapEditor: React.FC<EnhancedTipTapEditorProps> = ({
  content,
  onChange,
  onContentChange,
  placeholder,
  disabled = false,
  initialContent = "",
}) => {
  const { t } = useTranslation();
  const initialRef = useRef(initialContent);
  const isFirstUpdate = useRef(true);

  // Simple content sanitization
  const cleanContent = (html: string): string => {
    if (!html || typeof html !== "string") return "";

    // Basic cleaning - remove only the most problematic chars
    // eslint-disable-next-line no-control-regex
    return html.replace(/[\x00\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  };

  // Create editor with minimal extensions
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-400 underline",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color.configure({
        types: ["textStyle"],
      }),
      FontFamily.configure({
        types: ["textStyle"],
      }),
    ],

    content: "", // Always start empty

    editorProps: {
      attributes: {
        class:
          "sage-text-cream p-4 focus:outline-none min-h-[300px] prose prose-invert max-w-none bg-transparent",
        spellcheck: "true",
        style:
          "background-color: transparent !important; caret-color: #d4c4a8;",
      },
    },

    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      if (onContentChange && !isFirstUpdate.current) {
        const hasChanges = html !== initialRef.current;
        onContentChange(hasChanges);
      }
    },

    onCreate: ({ editor }) => {
      // Set content after editor is ready
      if (content) {
        const cleaned = cleanContent(content);
        if (cleaned) {
          try {
            editor.commands.setContent(cleaned, { emitUpdate: false });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) {
            console.warn("Failed to set initial content, using fallback");
          }
        }
      }
      isFirstUpdate.current = false;
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const cleaned = cleanContent(content);
      try {
        editor.commands.setContent(cleaned, { emitUpdate: false });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.warn("Content update failed");
      }
    }
  }, [content, editor]);

  // Handle disabled state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  if (!editor) {
    return (
      <Card className="sage-bg-medium p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sage-gold"></div>
          <span className="ml-3 sage-text-mist">{t("common.loading")}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Enhanced toolbar */}
      <div className="flex items-center gap-2 p-3 sage-bg-dark rounded-lg border sage-border flex-wrap">
        {/* Basic formatting */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            className={`p-2 rounded text-sm font-bold transition-colors ${
              editor.isActive("bold")
                ? "sage-bg-gold sage-text-dark"
                : "sage-text-mist hover:sage-text-cream hover:sage-bg-medium"
            }`}
          >
            B
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            className={`p-2 rounded text-sm italic transition-colors ${
              editor.isActive("italic")
                ? "sage-bg-gold sage-text-dark"
                : "sage-text-mist hover:sage-text-cream hover:sage-bg-medium"
            }`}
          >
            I
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={disabled}
            className={`p-2 rounded text-sm underline transition-colors ${
              editor.isActive("underline")
                ? "sage-bg-gold sage-text-dark"
                : "sage-text-mist hover:sage-text-cream hover:sage-bg-medium"
            }`}
          >
            U
          </button>
        </div>

        <div className="w-px h-6 sage-bg-medium"></div>

        {/* Text alignment */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            disabled={disabled}
            className={`p-2 rounded text-sm transition-colors ${
              editor.isActive({ textAlign: "left" }) ||
              (!editor.isActive({ textAlign: "center" }) &&
                !editor.isActive({ textAlign: "right" }))
                ? "sage-bg-gold sage-text-dark"
                : "sage-text-mist hover:sage-text-cream hover:sage-bg-medium"
            }`}
            title="Align Left"
          >
            ⇤
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            disabled={disabled}
            className={`p-2 rounded text-sm transition-colors ${
              editor.isActive({ textAlign: "center" })
                ? "sage-bg-gold sage-text-dark"
                : "sage-text-mist hover:sage-text-cream hover:sage-bg-medium"
            }`}
            title="Align Center"
          >
            ↔
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            disabled={disabled}
            className={`p-2 rounded text-sm transition-colors ${
              editor.isActive({ textAlign: "right" })
                ? "sage-bg-gold sage-text-dark"
                : "sage-text-mist hover:sage-text-cream hover:sage-bg-medium"
            }`}
            title="Align Right"
          >
            ⇥
          </button>
        </div>

        <div className="w-px h-6 sage-bg-medium"></div>

        {/* Lists - Fixed commands */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            className={`p-2 rounded text-sm transition-colors ${
              editor.isActive("bulletList")
                ? "sage-bg-gold sage-text-dark"
                : "sage-text-mist hover:sage-text-cream hover:sage-bg-medium"
            }`}
            title="Bullet List"
          >
            •
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            className={`p-2 rounded text-sm transition-colors ${
              editor.isActive("orderedList")
                ? "sage-bg-gold sage-text-dark"
                : "sage-text-mist hover:sage-text-cream hover:sage-bg-medium"
            }`}
            title="Numbered List"
          >
            1.
          </button>
        </div>

        <div className="w-px h-6 sage-bg-medium"></div>

        {/* Colors */}
        <div className="flex items-center gap-1">
          <input
            type="color"
            onChange={(e) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
            disabled={disabled}
            className="w-8 h-8 rounded border sage-border cursor-pointer"
            title="Text Color"
          />

          <button
            type="button"
            onClick={() => editor.chain().focus().unsetColor().run()}
            disabled={disabled}
            className="p-2 rounded text-xs sage-text-mist hover:sage-text-cream hover:sage-bg-medium transition-colors"
            title="Reset Color"
          >
            Reset
          </button>
        </div>

        <div className="w-px h-6 sage-bg-medium"></div>

        {/* Font family */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontFamily(e.target.value).run();
            } else {
              editor.chain().focus().unsetFontFamily().run();
            }
          }}
          disabled={disabled}
          className="px-2 py-1 rounded sage-bg-medium sage-text-cream text-sm border sage-border"
        >
          <option value="">Default Font</option>
          <option value="Inter, system-ui, sans-serif">Inter</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Courier New', monospace">Courier New</option>
          <option value="Arial, sans-serif">Arial</option>
        </select>
      </div>

      {/* Editor */}
      <Card className="sage-bg-medium border sage-border">
        <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg">
          <EditorContent editor={editor} className="prose-editor-custom" />

          {/* Placeholder */}
          {editor.isEmpty && (
            <div className="absolute top-4 left-4 sage-text-mist opacity-60 pointer-events-none">
              {placeholder || t("modal.createDocument.contentPlaceholder")}
            </div>
          )}
        </div>

        <style>{`
          .prose-editor-custom .ProseMirror {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
            border-radius: 8px;
            padding: 16px;
            min-height: 300px;
            color: #f1f5f9;
            outline: none;
            caret-color: #d4c4a8;
          }
          
          .prose-editor-custom .ProseMirror:hover {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
          }
          
          .prose-editor-custom .ProseMirror:focus {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
            box-shadow: 0 0 0 2px rgba(212, 196, 168, 0.3);
          }
          
          .prose-editor-custom .ProseMirror p {
            margin: 0.75rem 0;
            color: #f1f5f9;
          }
          
          .prose-editor-custom .ProseMirror ul, .prose-editor-custom .ProseMirror ol {
            padding-left: 1.5rem;
            margin: 1rem 0;
          }
          
          .prose-editor-custom .ProseMirror li {
            margin: 0.25rem 0;
            color: #f1f5f9;
          }
          
          .prose-editor-custom .ProseMirror ul li {
            list-style-type: disc;
          }
          
          .prose-editor-custom .ProseMirror ol li {
            list-style-type: decimal;
          }
        `}</style>
      </Card>

      {/* Status */}
      <div className="text-xs sage-text-mist flex justify-between">
        <div>
          {t("editor.characters")}:{" "}
          {editor.storage.characterCount?.characters() || 0}
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              editor.isEditable ? "bg-green-400" : "bg-red-400"
            }`}
          />
          <span>
            {editor.isEditable
              ? t("editor.status.ready")
              : t("editor.status.disabled")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTipTapEditor;
