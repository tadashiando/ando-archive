// src/components/Documents/Editor/EnhancedTipTapEditor.tsx - FIXED VERSION
import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from "@tiptap/extension-table";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import CharacterCount from "@tiptap/extension-character-count";
import { Card } from "../../UI";
import EditorToolbar from "./EditorToolbar";

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
  initialContent,
}) => {
  const { t } = useTranslation();
  const editorRef = useRef<HTMLDivElement>(null);
  const initialContentRef = useRef(initialContent || content);
  const isInitialMount = useRef(true);

  // FIX 1: Configure TipTap with proper extension configuration to avoid duplicates
  const editor = useEditor({
    extensions: [
      // Configure StarterKit to exclude extensions we'll add separately
      StarterKit.configure({
        // Disable built-in link to avoid conflicts
        link: false,
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),

      // Add extensions individually to avoid conflicts
      Underline,

      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "sage-text-gold hover:sage-text-cream underline",
        },
      }),

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      Highlight.configure({
        multicolor: true,
      }),

      Image.configure({
        inline: true,
        allowBase64: true,
      }),

      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,

      Color.configure({
        types: ["textStyle"],
      }),
      TextStyle,

      FontFamily.configure({
        types: ["textStyle"],
      }),

      CharacterCount,
    ],

    // FIX 2: Sanitize initial content to avoid InvalidCharacterError
    content:
      sanitizeContent(content) ||
      `<p>${placeholder || t("modal.createDocument.contentPlaceholder")}</p>`,

    editorProps: {
      attributes: {
        class: `
          sage-text-cream p-6 rounded-xl min-h-[400px] focus:outline-none 
          prose prose-invert max-w-none prose-lg leading-relaxed
          prose-headings:sage-text-white prose-headings:font-bold
          prose-p:sage-text-cream prose-p:leading-relaxed
          prose-strong:sage-text-white prose-strong:font-bold
          prose-em:sage-text-cream prose-em:italic
          prose-ul:sage-text-cream prose-ol:sage-text-cream
          prose-li:sage-text-cream prose-li:my-1
          prose-blockquote:sage-text-mist prose-blockquote:border-l-sage-gold
          prose-code:sage-bg-medium prose-code:sage-text-gold prose-code:px-1 prose-code:rounded
          prose-pre:sage-bg-dark prose-pre:sage-text-cream
          prose-table:sage-text-cream prose-th:sage-text-white prose-th:font-bold
          prose-td:sage-text-cream prose-td:border-sage-light
          prose-th:border-sage-light
        `,
        spellcheck: "true",
      },

      // FIX 3: Improved keyboard handling with proper error handling
      handleKeyDown: (_view, event) => {
        try {
          // Handle clipboard and shortcuts
          if (event.metaKey || event.ctrlKey) {
            switch (event.key) {
              case "c":
              case "v":
              case "x":
              case "a":
                // Let browser handle clipboard operations
                return false;
              case "z":
                if (event.shiftKey) {
                  editor?.chain().focus().redo().run();
                  event.preventDefault();
                  return true;
                } else {
                  editor?.chain().focus().undo().run();
                  event.preventDefault();
                  return true;
                }
              case "b":
                editor?.chain().focus().toggleBold().run();
                event.preventDefault();
                return true;
              case "i":
                editor?.chain().focus().toggleItalic().run();
                event.preventDefault();
                return true;
              case "u":
                editor?.chain().focus().toggleUnderline().run();
                event.preventDefault();
                return true;
            }
          }
          return false;
        } catch (error) {
          console.warn("Keyboard shortcut error:", error);
          return false;
        }
      },
    },

    onUpdate: ({ editor }) => {
      try {
        const html = editor.getHTML();
        const sanitizedHtml = sanitizeContent(html);
        onChange(sanitizedHtml);

        // Track changes for unsaved content detection
        if (onContentChange && !isInitialMount.current) {
          const hasChanges =
            sanitizedHtml !== sanitizeContent(initialContentRef.current);
          onContentChange(hasChanges);
        }
      } catch (error) {
        console.error("Editor update error:", error);
      }
    },

    editable: !disabled,

    // Add error handling
    onTransaction: () => {
      try {
        // Handle transactions safely
        return true;
      } catch (error) {
        console.warn("Transaction error:", error);
        return false;
      }
    },
  });

  // FIX 4: Content sanitization function
  function sanitizeContent(htmlContent: string): string {
    if (!htmlContent) return "";

    try {
      // Remove invalid characters that could cause InvalidCharacterError
      return htmlContent
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
        .replace(/\uFEFF/g, "") // Remove BOM
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // Additional cleanup
        .trim();
    } catch (error) {
      console.warn("Content sanitization error:", error);
      return `<p>${placeholder || "Content could not be loaded"}</p>`;
    }
  }

  // Effect to handle initial mount flag
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, []);

  // Focus management and clipboard fix with error handling
  useEffect(() => {
    if (editor && !disabled) {
      try {
        const editorElement = editorRef.current?.querySelector(
          "[contenteditable]"
        ) as HTMLElement;
        if (editorElement) {
          editorElement.setAttribute("tabindex", "0");

          // Fix clipboard events for Tauri
          const handleClipboard = (e: ClipboardEvent) => {
            try {
              // Don't prevent default - let browser handle clipboard
              e.stopPropagation();
            } catch (error) {
              console.warn("Clipboard event error:", error);
            }
          };

          editorElement.addEventListener("copy", handleClipboard);
          editorElement.addEventListener("paste", handleClipboard);
          editorElement.addEventListener("cut", handleClipboard);

          return () => {
            editorElement.removeEventListener("copy", handleClipboard);
            editorElement.removeEventListener("paste", handleClipboard);
            editorElement.removeEventListener("cut", handleClipboard);
          };
        }
      } catch (error) {
        console.warn("Editor setup error:", error);
      }
    }
  }, [editor, disabled]);

  // Update content when prop changes with error handling
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      try {
        const sanitizedContent = sanitizeContent(content);
        editor.commands.setContent(sanitizedContent);
      } catch (error) {
        console.warn("Content update error:", error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  // Update initial content reference when initialContent changes
  useEffect(() => {
    initialContentRef.current = sanitizeContent(initialContent || content);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContent, content]);

  if (!editor) {
    return (
      <Card variant="ghost" padding="lg" className="sage-bg-medium">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-gold"></div>
          <span className="ml-3 sage-text-mist">{t("common.loading")}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4" ref={editorRef}>
      {/* Enhanced Toolbar */}
      <EditorToolbar editor={editor} isLoading={disabled} />

      {/* Editor Content with Error Boundary */}
      <Card
        variant="ghost"
        padding="none"
        className="sage-bg-medium rounded-xl overflow-hidden"
      >
        <div className="sage-bg-medium rounded-xl min-h-[400px]">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </Card>

      {/* Editor Status */}
      <div className="flex justify-between items-center text-xs sage-text-mist">
        <div className="flex space-x-4">
          <span>
            {t("editor.characters")}:{" "}
            {editor.storage.characterCount?.characters() || 0}
          </span>
          <span>
            {t("editor.words")}: {editor.storage.characterCount?.words() || 0}
          </span>
        </div>

        <div className="flex items-center space-x-2">
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

      {/* Keyboard Shortcuts Help */}
      <details className="sage-text-mist text-xs">
        <summary className="cursor-pointer hover:sage-text-cream">
          {t("editor.keyboardShortcuts")}
        </summary>
        <div className="mt-2 space-y-1 ml-4">
          <div>⌘/Ctrl + B: {t("editor.bold")}</div>
          <div>⌘/Ctrl + I: {t("editor.italic")}</div>
          <div>⌘/Ctrl + U: {t("editor.underline")}</div>
          <div>⌘/Ctrl + Z: {t("editor.undo")}</div>
          <div>⌘/Ctrl + Shift + Z: {t("editor.redo")}</div>
          <div>⌘/Ctrl + C/V/X: {t("editor.clipboard")}</div>
        </div>
      </details>
    </div>
  );
};

export default EnhancedTipTapEditor;
