import { create } from "zustand";

// Using the same AttachmentFile type from the current codebase
interface AttachmentFile {
  file: File;
  id?: string;
  preview?: string;
}

interface EditorStore {
  // Editor content state
  hasUnsavedChanges: boolean;
  currentTitle: string;
  currentContent: string;
  currentDescription: string;

  // Attachments
  attachments: AttachmentFile[];
  selectedAttachment: AttachmentFile | null;

  // Editor UI state
  isAutoSaving: boolean;
  lastSaved: Date | null;

  // Actions
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setCurrentTitle: (title: string) => void;
  setCurrentContent: (content: string) => void;
  setCurrentDescription: (description: string) => void;

  // Content actions that automatically mark as changed
  updateTitle: (title: string) => void;
  updateContent: (content: string) => void;
  updateDescription: (description: string) => void;

  // Attachments management
  setAttachments: (attachments: AttachmentFile[]) => void;
  addAttachment: (attachment: AttachmentFile) => void;
  removeAttachment: (file: File) => void;
  setSelectedAttachment: (attachment: AttachmentFile | null) => void;
  clearAttachments: () => void;

  // Auto-save state
  setIsAutoSaving: (isAutoSaving: boolean) => void;
  setLastSaved: (date: Date | null) => void;

  // Reset editor
  clearEditor: () => void;
  loadDocument: (title: string, description: string, content: string) => void;

  // Utility methods
  hasContent: () => boolean;
  getWordCount: () => number;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  hasUnsavedChanges: false,
  currentTitle: "",
  currentContent: "",
  currentDescription: "",
  attachments: [],
  selectedAttachment: null,
  isAutoSaving: false,
  lastSaved: null,

  // Basic setters (don't mark as changed)
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
  setCurrentTitle: (title) => set({ currentTitle: title }),
  setCurrentContent: (content) => set({ currentContent: content }),
  setCurrentDescription: (description) =>
    set({ currentDescription: description }),

  // Update actions (mark as changed)
  updateTitle: (title) =>
    set({
      currentTitle: title,
      hasUnsavedChanges: true,
    }),

  updateContent: (content) =>
    set({
      currentContent: content,
      hasUnsavedChanges: true,
    }),

  updateDescription: (description) =>
    set({
      currentDescription: description,
      hasUnsavedChanges: true,
    }),

  // Attachments management
  setAttachments: (attachments) => set({ attachments }),

  addAttachment: (attachment) =>
    set((state) => ({
      attachments: [...state.attachments, attachment],
      hasUnsavedChanges: true,
    })),

  removeAttachment: (file) =>
    set((state) => ({
      attachments: state.attachments.filter((att) => att.file !== file),
      selectedAttachment:
        state.selectedAttachment?.file === file
          ? null
          : state.selectedAttachment,
      hasUnsavedChanges: true,
    })),

  setSelectedAttachment: (attachment) =>
    set({ selectedAttachment: attachment }),
  clearAttachments: () => set({ attachments: [], selectedAttachment: null }),

  // Auto-save state
  setIsAutoSaving: (isAutoSaving) => set({ isAutoSaving }),
  setLastSaved: (date) => set({ lastSaved: date }),

  // Reset and load
  clearEditor: () =>
    set({
      hasUnsavedChanges: false,
      currentTitle: "",
      currentContent: "",
      currentDescription: "",
      attachments: [],
      selectedAttachment: null,
      isAutoSaving: false,
      lastSaved: null,
    }),

  loadDocument: (title, description, content) =>
    set({
      currentTitle: title,
      currentDescription: description || "",
      currentContent: content,
      hasUnsavedChanges: false,
      lastSaved: new Date(),
    }),

  // Utility methods
  hasContent: () => {
    const { currentTitle, currentContent, currentDescription } = get();
    return !!(
      currentTitle.trim() ||
      currentContent.trim() ||
      currentDescription.trim()
    );
  },

  getWordCount: () => {
    const { currentContent } = get();
    // Simple word count - removes HTML tags and counts words
    const textContent = currentContent.replace(/<[^>]*>/g, "");
    const words = textContent
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    return words.length;
  },
}));
