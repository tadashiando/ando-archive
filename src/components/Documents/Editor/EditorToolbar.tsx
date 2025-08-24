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
  EyeDropperIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  DocumentDuplicateIcon,
  ScissorsIcon,
  ClipboardIcon,
  SwatchIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import {
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { Button, IconButton } from "../../UI";

interface EditorToolbarProps {
  editor: Editor | null;
  isLoading?: boolean;
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

  if (!editor) {
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const addImage = useCallback(() => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const addTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  // Handle clipboard operations with proper focus
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleCopy = useCallback(() => {
    document.execCommand("copy");
    editor.commands.focus();
  }, [editor]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleCut = useCallback(() => {
    document.execCommand("cut");
    editor.commands.focus();
  }, [editor]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handlePaste = useCallback(() => {
    document.execCommand("paste");
    editor.commands.focus();
  }, [editor]);

  return (
    <div className="sage-bg-light rounded-xl p-3 space-y-3">
      {/* Row 1: Basic Formatting & Clipboard */}
      <div className="flex items-center space-x-1 flex-wrap gap-1">
        {/* Clipboard Operations */}
        <div className="flex items-center space-x-1 pr-2 border-r sage-border">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run() || isLoading}
            icon={<ArrowUturnLeftIcon className="h-4 w-4" />}
            title={t("editor.undo") + " (⌘Z)"}
          />
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run() || isLoading}
            icon={<ArrowUturnRightIcon className="h-4 w-4" />}
            title={t("editor.redo") + " (⌘⇧Z)"}
          />
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={isLoading}
            icon={<DocumentDuplicateIcon className="h-4 w-4" />}
            title={t("editor.copy") + " (⌘C)"}
          />
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleCut}
            disabled={isLoading}
            icon={<ScissorsIcon className="h-4 w-4" />}
            title={t("editor.cut") + " (⌘X)"}
          />
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handlePaste}
            disabled={isLoading}
            icon={<ClipboardIcon className="h-4 w-4" />}
            title={t("editor.paste") + " (⌘V)"}
          />
        </div>

        {/* Text Formatting */}
        <div className="flex items-center space-x-1 pr-2 border-r sage-border">
          <IconButton
            variant={editor.isActive("bold") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={isLoading}
            icon={<BoldIcon className="h-4 w-4" />}
            title={t("editor.bold") + " (⌘B)"}
          />
          <IconButton
            variant={editor.isActive("italic") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={isLoading}
            icon={<ItalicIcon className="h-4 w-4" />}
            title={t("editor.italic") + " (⌘I)"}
          />
          <IconButton
            variant={editor.isActive("underline") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={isLoading}
            icon={<UnderlineIcon className="h-4 w-4" />}
            title={t("editor.underline") + " (⌘U)"}
          />
          <IconButton
            variant={editor.isActive("strike") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={isLoading}
            icon={<StrikethroughIcon className="h-4 w-4" />}
            title={t("editor.strikethrough")}
          />
          <IconButton
            variant={editor.isActive("code") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={isLoading}
            icon={<CodeBracketIcon className="h-4 w-4" />}
            title={t("editor.code")}
          />
        </div>

        {/* Colors */}
        <div className="flex items-center space-x-1 pr-2 border-r sage-border relative">
          <div className="relative">
            <IconButton
              variant={showColorPicker === "text" ? "primary" : "ghost"}
              size="sm"
              onClick={() =>
                setShowColorPicker(showColorPicker === "text" ? null : "text")
              }
              disabled={isLoading}
              icon={<SwatchIcon className="h-4 w-4" />}
              title={t("editor.textColor")}
            />
            {showColorPicker === "text" && (
              <div className="absolute top-full left-0 mt-1 p-2 sage-bg-dark rounded-lg shadow-lg z-50 grid grid-cols-4 gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    className={`w-6 h-6 rounded border-2 ${
                      editor.getAttributes("textStyle").color === color.value
                        ? "border-sage-gold"
                        : "border-sage-mist"
                    } ${color.bg}`}
                    onClick={() => {
                      if (color.value) {
                        editor.chain().focus().setColor(color.value).run();
                      } else {
                        editor.chain().focus().unsetColor().run();
                      }
                      setShowColorPicker(null);
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <IconButton
              variant={showColorPicker === "highlight" ? "primary" : "ghost"}
              size="sm"
              onClick={() =>
                setShowColorPicker(
                  showColorPicker === "highlight" ? null : "highlight"
                )
              }
              disabled={isLoading}
              icon={<PaintBrushIcon className="h-4 w-4" />}
              title={t("editor.highlight")}
            />
            {showColorPicker === "highlight" && (
              <div className="absolute top-full left-0 mt-1 p-2 sage-bg-dark rounded-lg shadow-lg z-50 grid grid-cols-3 gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    className={`w-6 h-6 rounded border-2 ${
                      editor.getAttributes("highlight").color === color.value
                        ? "border-sage-gold"
                        : "border-sage-mist"
                    } ${color.bg}`}
                    onClick={() => {
                      if (color.value) {
                        editor
                          .chain()
                          .focus()
                          .toggleHighlight({ color: color.value })
                          .run();
                      } else {
                        editor.chain().focus().unsetHighlight().run();
                      }
                      setShowColorPicker(null);
                    }}
                    title={color.name}
                  />
                ))}
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
          >
            <EyeDropperIcon className="h-4 w-4 mr-1" />
            Font
          </Button>
          {showFontPicker && (
            <div className="absolute top-full left-0 mt-1 sage-bg-dark rounded-lg shadow-lg z-50 min-w-40">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.name}
                  className={`w-full text-left px-3 py-2 text-sm hover:sage-bg-medium ${
                    editor.getAttributes("textStyle").fontFamily === font.value
                      ? "sage-bg-gold text-gray-800"
                      : "sage-text-cream"
                  }`}
                  style={{ fontFamily: font.value }}
                  onClick={() => {
                    if (font.value) {
                      editor.chain().focus().setFontFamily(font.value).run();
                    } else {
                      editor.chain().focus().unsetFontFamily().run();
                    }
                    setShowFontPicker(false);
                  }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Headings & Structure */}
      <div className="flex items-center space-x-1 flex-wrap gap-1">
        {/* Headings */}
        <div className="flex items-center space-x-1 pr-2 border-r sage-border">
          <Button
            variant={
              editor.isActive("heading", { level: 1 }) ? "primary" : "ghost"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            disabled={isLoading}
          >
            H1
          </Button>
          <Button
            variant={
              editor.isActive("heading", { level: 2 }) ? "primary" : "ghost"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            disabled={isLoading}
          >
            H2
          </Button>
          <Button
            variant={
              editor.isActive("heading", { level: 3 }) ? "primary" : "ghost"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            disabled={isLoading}
          >
            H3
          </Button>
          <Button
            variant={editor.isActive("paragraph") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().setParagraph().run()}
            disabled={isLoading}
          >
            P
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center space-x-1 pr-2 border-r sage-border">
          <IconButton
            variant={editor.isActive("bulletList") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={isLoading}
            icon={<ListBulletIcon className="h-4 w-4" />}
            title={t("editor.bulletList")}
          />
          <IconButton
            variant={editor.isActive("orderedList") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={isLoading}
            icon={<NumberedListIcon className="h-4 w-4" />}
            title={t("editor.numberedList")}
          />
          <IconButton
            variant={editor.isActive("blockquote") ? "primary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={isLoading}
            icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
            title={t("editor.blockquote")}
          />
        </div>

        {/* Alignment */}
        <div className="flex items-center space-x-1 pr-2 border-r sage-border">
          <IconButton
            variant={
              editor.isActive({ textAlign: "left" }) ? "primary" : "ghost"
            }
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            disabled={isLoading}
            icon={<Bars3BottomLeftIcon className="h-4 w-4" />}
            title={t("editor.alignLeft")}
          />
          <IconButton
            variant={
              editor.isActive({ textAlign: "center" }) ? "primary" : "ghost"
            }
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            disabled={isLoading}
            icon={<Bars3Icon className="h-4 w-4" />}
            title={t("editor.alignCenter")}
          />
          <IconButton
            variant={
              editor.isActive({ textAlign: "right" }) ? "primary" : "ghost"
            }
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            disabled={isLoading}
            icon={<Bars3BottomRightIcon className="h-4 w-4" />}
            title={t("editor.alignRight")}
          />
        </div>

        {/* Media & Links */}
        <div className="flex items-center space-x-1">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={setLink}
            disabled={isLoading}
            icon={<LinkIcon className="h-4 w-4" />}
            title={t("editor.link") + " (⌘K)"}
          />
          <IconButton
            variant="ghost"
            size="sm"
            onClick={addImage}
            disabled={isLoading}
            icon={<PhotoIcon className="h-4 w-4" />}
            title={t("editor.image")}
          />
          <IconButton
            variant="ghost"
            size="sm"
            onClick={addTable}
            disabled={isLoading}
            icon={<TableCellsIcon className="h-4 w-4" />}
            title={t("editor.table")}
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
