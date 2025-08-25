// src/components/Documents/Editor/EditorToolbar.tsx - FIXED VERSION
import React, { useState, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeBracketIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  PhotoIcon,
  TableCellsIcon,
  PaintBrushIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/24/outline";
import {
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { Button, IconButton } from "../../UI";

// FIX 1: Correct interface matching the component usage
interface EditorToolbarProps {
  editor: Editor | null;
  isLoading?: boolean; // Changed from 'disabled' to match usage in EnhancedTipTapEditor
}

// Predefined colors for text and highlight
const TEXT_COLORS = [
  { name: "Default", value: "", bg: "bg-gray-500" },
  { name: "White", value: "#ffffff", bg: "bg-white" },
  { name: "Gold", value: "#d4c4a8", bg: "bg-yellow-400" },
  { name: "Red", value: "#ef4444", bg: "bg-red-500" },
  { name: "Blue", value: "#3b82f6", bg: "bg-blue-500" },
  { name: "Green", value: "#10b981", bg: "bg-green-500" },
  { name: "Purple", value: "#8b5cf6", bg: "bg-purple-500" },
  { name: "Orange", value: "#f97316", bg: "bg-orange-500" },
];

const HIGHLIGHT_COLORS = [
  { name: "None", value: "", bg: "bg-transparent" },
  { name: "Yellow", value: "#fef08a", bg: "bg-yellow-200" },
  { name: "Green", value: "#bbf7d0", bg: "bg-green-200" },
  { name: "Blue", value: "#bfdbfe", bg: "bg-blue-200" },
  { name: "Red", value: "#fecaca", bg: "bg-red-200" },
  { name: "Purple", value: "#e9d5ff", bg: "bg-purple-200" },
  { name: "Orange", value: "#fed7aa", bg: "bg-orange-200" },
];

const FONT_FAMILIES = [
  { name: "Default", value: "" },
  { name: "Overlock", value: "Overlock, system-ui, sans-serif" },
  { name: "Sans Serif", value: "system-ui, sans-serif" },
  { name: "Serif", value: "Georgia, serif" },
  { name: "Monospace", value: "Monaco, 'Cascadia Code', monospace" },
];

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [showColorPicker, setShowColorPicker] = useState<
    "text" | "highlight" | null
  >(null);
  const [showFontPicker, setShowFontPicker] = useState(false);

  // FIX 2: Always define useCallback hooks at top level
  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt(t("editor.imageUrl", "Image URL"));
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor, t]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt(t("editor.linkUrl", "Link URL"), previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor, t]);

  const addTable = useCallback(() => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const setTextColor = useCallback(
    (color: string) => {
      if (!editor) return;

      if (color === "") {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(color).run();
      }
      setShowColorPicker(null);
    },
    [editor]
  );

  const setHighlightColor = useCallback(
    (color: string) => {
      if (!editor) return;

      if (color === "") {
        editor.chain().focus().unsetHighlight().run();
      } else {
        editor.chain().focus().setHighlight({ color }).run();
      }
      setShowColorPicker(null);
    },
    [editor]
  );

  const setFontFamily = useCallback(
    (fontFamily: string) => {
      if (!editor) return;

      if (fontFamily === "") {
        editor.chain().focus().unsetFontFamily().run();
      } else {
        editor.chain().focus().setFontFamily(fontFamily).run();
      }
      setShowFontPicker(false);
    },
    [editor]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      {/* Main Toolbar */}
      <div className="flex items-center justify-between p-4 space-x-2 flex-wrap">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1">
          <IconButton
            variant={editor.isActive("bold") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={isLoading}
            icon={<BoldIcon className="h-4 w-4" />}
            title={t("editor.bold", "Bold") + " (⌘B)"}
          />
          <IconButton
            variant={editor.isActive("italic") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={isLoading}
            icon={<ItalicIcon className="h-4 w-4" />}
            title={t("editor.italic", "Italic") + " (⌘I)"}
          />
          <IconButton
            variant={editor.isActive("underline") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={isLoading}
            icon={<UnderlineIcon className="h-4 w-4" />}
            title={t("editor.underline", "Underline") + " (⌘U)"}
          />
          <IconButton
            variant={editor.isActive("strike") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={isLoading}
            icon={<StrikethroughIcon className="h-4 w-4" />}
            title={t("editor.strikethrough", "Strikethrough")}
          />
          <IconButton
            variant={editor.isActive("code") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={isLoading}
            icon={<CodeBracketIcon className="h-4 w-4" />}
            title={t("editor.code", "Code")}
          />
        </div>

        {/* Headings */}
        <div className="flex items-center space-x-1">
          {[1, 2, 3].map((level) => (
            <Button
              key={level}
              variant={
                editor.isActive("heading", { level }) ? "primary" : "ghost"
              }
              size="sm"
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: level as 1 | 2 | 3 })
                  .run()
              }
              disabled={isLoading}
              className="text-xs px-2"
            >
              H{level}
            </Button>
          ))}
        </div>

        {/* Lists */}
        <div className="flex items-center space-x-1">
          <IconButton
            variant={editor.isActive("bulletList") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={isLoading}
            icon={<ListBulletIcon className="h-4 w-4" />}
            title={t("editor.bulletList", "Bullet List")}
          />
          <IconButton
            variant={editor.isActive("orderedList") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={isLoading}
            icon={<NumberedListIcon className="h-4 w-4" />}
            title={t("editor.numberedList", "Numbered List")}
          />
        </div>

        {/* Color Controls */}
        <div className="flex items-center space-x-1">
          <div className="relative">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() =>
                setShowColorPicker(showColorPicker === "text" ? null : "text")
              }
              disabled={isLoading}
              icon={<PaintBrushIcon className="h-4 w-4" />}
              title={t("editor.textColor", "Text Color")}
            />
            {showColorPicker === "text" && (
              <div className="absolute top-full left-0 mt-2 z-50 sage-bg-dark border sage-border rounded-lg p-3 shadow-xl">
                <div className="grid grid-cols-4 gap-2 w-40">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color.name}
                      className={`w-8 h-8 rounded border-2 border-gray-600 hover:border-gray-400 ${color.bg}`}
                      onClick={() => setTextColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <IconButton
              variant={editor.isActive("highlight") ? "primary" : "ghost"}
              size="sm"
              onClick={() =>
                setShowColorPicker(
                  showColorPicker === "highlight" ? null : "highlight"
                )
              }
              disabled={isLoading}
              icon={<PaintBrushIcon className="h-4 w-4" />}
              title={t("editor.highlight", "Highlight")}
            />
            {showColorPicker === "highlight" && (
              <div className="absolute top-full left-0 mt-2 z-50 sage-bg-dark border sage-border rounded-lg p-3 shadow-xl">
                <div className="grid grid-cols-4 gap-2 w-40">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <button
                      key={color.name}
                      className={`w-8 h-8 rounded border-2 border-gray-600 hover:border-gray-400 ${color.bg}`}
                      onClick={() => setHighlightColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Font Family */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFontPicker(!showFontPicker)}
            disabled={isLoading}
            className="text-xs"
          >
            Font
          </Button>
          {showFontPicker && (
            <div className="absolute top-full left-0 mt-2 z-50 sage-bg-dark border sage-border rounded-lg p-2 shadow-xl min-w-[150px]">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.name}
                  className="block w-full text-left px-3 py-2 text-sm hover:sage-bg-medium rounded sage-text-cream"
                  onClick={() => setFontFamily(font.value)}
                  style={{ fontFamily: font.value || undefined }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alignment */}
        <div className="flex items-center space-x-1">
          <IconButton
            variant={
              editor.isActive({ textAlign: "left" }) ? "primary" : "ghost"
            }
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            disabled={isLoading}
            icon={<Bars3BottomLeftIcon className="h-4 w-4" />}
            title={t("editor.alignLeft", "Align Left")}
          />
          <IconButton
            variant={
              editor.isActive({ textAlign: "center" }) ? "primary" : "ghost"
            }
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            disabled={isLoading}
            icon={<Bars3Icon className="h-4 w-4" />}
            title={t("editor.alignCenter", "Center")}
          />
          <IconButton
            variant={
              editor.isActive({ textAlign: "right" }) ? "primary" : "ghost"
            }
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            disabled={isLoading}
            icon={<Bars3BottomRightIcon className="h-4 w-4" />}
            title={t("editor.alignRight", "Align Right")}
          />
        </div>

        {/* Media & Links */}
        <div className="flex items-center space-x-1">
          <IconButton
            variant={editor.isActive("link") ? "primary" : "ghost"}
            size="sm"
            onClick={setLink}
            disabled={isLoading}
            icon={<LinkIcon className="h-4 w-4" />}
            title={t("editor.link", "Link") + " (⌘K)"}
          />
          <IconButton
            variant="ghost"
            size="sm"
            onClick={addImage}
            disabled={isLoading}
            icon={<PhotoIcon className="h-4 w-4" />}
            title={t("editor.image", "Image")}
          />
          <IconButton
            variant="ghost"
            size="sm"
            onClick={addTable}
            disabled={isLoading}
            icon={<TableCellsIcon className="h-4 w-4" />}
            title={t("editor.table", "Table")}
          />
        </div>

        {/* History */}
        <div className="flex items-center space-x-1">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={isLoading || !editor.can().undo()}
            icon={<ArrowUturnLeftIcon className="h-4 w-4" />}
            title={t("editor.undo", "Undo") + " (⌘Z)"}
          />
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={isLoading || !editor.can().redo()}
            icon={<ArrowUturnRightIcon className="h-4 w-4" />}
            title={t("editor.redo", "Redo") + " (⌘⇧Z)"}
          />
        </div>
      </div>

      {/* Click outside handler */}
      {(showColorPicker || showFontPicker) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowColorPicker(null);
            setShowFontPicker(false);
          }}
        />
      )}
    </div>
  );
};

export default EditorToolbar;
