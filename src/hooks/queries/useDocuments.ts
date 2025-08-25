import { useQuery } from "@tanstack/react-query";
import { db } from "../../database";
import type { Document, Attachment } from "../../database";

// Query keys factory for documents
export const documentsKeys = {
  all: ["documents"] as const,
  lists: () => [...documentsKeys.all, "list"] as const,
  list: (categoryId: number, includeSubcategories?: boolean) =>
    [...documentsKeys.lists(), categoryId, includeSubcategories] as const,
  details: () => [...documentsKeys.all, "detail"] as const,
  detail: (id: number) => [...documentsKeys.details(), id] as const,
  attachments: (documentId: number) =>
    [...documentsKeys.all, "attachments", documentId] as const,
  search: (query: string) => [...documentsKeys.all, "search", query] as const,
} as const;

/**
 * Hook to fetch documents by category
 */
export const useDocuments = (
  categoryId: number | null,
  includeSubcategories: boolean = false
) => {
  return useQuery({
    queryKey: documentsKeys.list(categoryId || 0, includeSubcategories),
    queryFn: async (): Promise<Document[]> => {
      if (!categoryId) return [];

      if (includeSubcategories) {
        return await db.getDocumentsByCategoryTree(categoryId);
      } else {
        return await db.getDocumentsByCategory(categoryId);
      }
    },
    enabled: !!categoryId,
    staleTime: 1 * 60 * 1000, // 1 minute - documents can change frequently
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch a specific document by ID
 */
export const useDocument = (documentId: number | null) => {
  return useQuery({
    queryKey: documentsKeys.detail(documentId || 0),
    queryFn: async (): Promise<Document | null> => {
      if (!documentId) return null;
      const document = await db.getDocumentById(documentId);
      return document;
    },
    enabled: !!documentId,
    staleTime: 30 * 1000, // 30 seconds - current document should be fresh
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch document attachments
 */
export const useDocumentAttachments = (documentId: number | null) => {
  return useQuery({
    queryKey: documentsKeys.attachments(documentId || 0),
    queryFn: async (): Promise<Attachment[]> => {
      if (!documentId) return [];
      const attachments = await db.getAttachments(documentId);
      return attachments;
    },
    enabled: !!documentId,
    staleTime: 2 * 60 * 1000, // 2 minutes - attachments don't change often
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to search documents across all categories
 */
export const useDocumentSearch = (searchQuery: string) => {
  return useQuery({
    queryKey: documentsKeys.search(searchQuery),
    queryFn: async (): Promise<Document[]> => {
      if (!searchQuery.trim()) return [];
      const results = await db.searchDocuments(searchQuery);
      return results;
    },
    enabled: !!searchQuery.trim(),
    staleTime: 30 * 1000, // 30 seconds - search results should be fresh
    gcTime: 2 * 60 * 1000,
  });
};
