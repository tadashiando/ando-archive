import { create } from "zustand";
import type { Document } from "../database";

interface DocumentStore {
  // Current state
  documents: Document[];
  selectedDocumentId: number | null;
  editingDocumentId: number | null;
  searchQuery: string;

  // Document to delete (for confirmation dialog)
  documentToDelete: Document | null;

  // Loading and error states (complementing TanStack Query)
  isDeleting: boolean;

  // Actions
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (document: Document) => void;
  removeDocument: (id: number) => void;
  clearDocuments: () => void;

  // Document selection
  setSelectedDocument: (id: number | null) => void;
  setEditingDocument: (id: number | null) => void;
  clearSelection: () => void;

  // Search
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // Delete flow
  setDocumentToDelete: (document: Document | null) => void;
  setIsDeleting: (isDeleting: boolean) => void;

  // Utility methods
  getDocumentById: (id: number) => Document | null;
  getFilteredDocuments: () => Document[];
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // Initial state
  documents: [],
  selectedDocumentId: null,
  editingDocumentId: null,
  searchQuery: "",
  documentToDelete: null,
  isDeleting: false,

  // Document management
  setDocuments: (documents) => set({ documents }),

  addDocument: (document) =>
    set((state) => ({
      documents: [...state.documents, document],
    })),

  updateDocument: (updatedDocument) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === updatedDocument.id ? updatedDocument : doc
      ),
    })),

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
      selectedDocumentId:
        state.selectedDocumentId === id ? null : state.selectedDocumentId,
      editingDocumentId:
        state.editingDocumentId === id ? null : state.editingDocumentId,
    })),

  clearDocuments: () =>
    set({
      documents: [],
      selectedDocumentId: null,
      editingDocumentId: null,
    }),

  // Selection management
  setSelectedDocument: (id) => set({ selectedDocumentId: id }),
  setEditingDocument: (id) => set({ editingDocumentId: id }),

  clearSelection: () =>
    set({
      selectedDocumentId: null,
      editingDocumentId: null,
    }),

  // Search
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearch: () => set({ searchQuery: "" }),

  // Delete flow
  setDocumentToDelete: (document) => set({ documentToDelete: document }),
  setIsDeleting: (isDeleting) => set({ isDeleting }),

  // Utility methods
  getDocumentById: (id) => {
    const { documents } = get();
    return documents.find((doc) => doc.id === id) || null;
  },

  getFilteredDocuments: () => {
    const { documents, searchQuery } = get();

    if (!searchQuery.trim()) {
      return documents;
    }

    const query = searchQuery.toLowerCase().trim();
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.text_content?.toLowerCase().includes(query)
    );
  },
}));
