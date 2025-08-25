import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "../../database";
import type { Document } from "../../database";
import { documentsKeys } from "../queries/useDocuments";
import { categoriesKeys } from "../queries/useCategories";

interface CreateDocumentData {
  title: string;
  description: string;
  text_content: string;
  category_id: number;
}

interface UpdateDocumentData {
  id: number;
  title: string;
  description: string;
  text_content: string;
  category_id: number;
}

interface AttachmentFile {
  file: File;
  id?: string;
  preview?: string;
}

interface CreateDocumentWithAttachmentsData extends CreateDocumentData {
  attachments?: AttachmentFile[];
}

interface UpdateDocumentWithAttachmentsData extends UpdateDocumentData {
  attachments?: AttachmentFile[];
}

/**
 * Hook to create a new document
 */
export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateDocumentWithAttachmentsData
    ): Promise<Document> => {
      // Create document
      const documentId = await db.createDocument(
        data.title,
        data.description,
        data.text_content,
        data.category_id
      );

      // Handle attachments if provided
      if (data.attachments && data.attachments.length > 0) {
        for (const attachment of data.attachments) {
          await db.addAttachment(documentId, attachment.file);
        }
      }

      // Fetch the created document
      const newDocument = await db.getDocumentById(documentId);
      if (!newDocument) {
        throw new Error("Failed to fetch created document");
      }

      return newDocument;
    },

    onMutate: async (newDocumentData) => {
      // Cancel outgoing queries for this category
      await queryClient.cancelQueries({
        queryKey: documentsKeys.list(newDocumentData.category_id, false),
      });
      await queryClient.cancelQueries({
        queryKey: documentsKeys.list(newDocumentData.category_id, true),
      });

      // Snapshot previous value
      const previousDocuments = queryClient.getQueryData<Document[]>(
        documentsKeys.list(newDocumentData.category_id, false)
      );

      // Optimistic update
      if (previousDocuments) {
        const optimisticDocument: Document = {
          id: Date.now(), // Temporary ID
          title: newDocumentData.title,
          description: newDocumentData.description,
          text_content: newDocumentData.text_content,
          category_id: newDocumentData.category_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData(
          documentsKeys.list(newDocumentData.category_id, false),
          [...previousDocuments, optimisticDocument]
        );

        // Also update the tree view if it's cached
        const previousTreeDocuments = queryClient.getQueryData<Document[]>(
          documentsKeys.list(newDocumentData.category_id, true)
        );
        if (previousTreeDocuments) {
          queryClient.setQueryData(
            documentsKeys.list(newDocumentData.category_id, true),
            [...previousTreeDocuments, optimisticDocument]
          );
        }
      }

      return { previousDocuments, categoryId: newDocumentData.category_id };
    },

    onError: (err, newDocumentData, context) => {
      // Rollback on error
      if (context?.previousDocuments && context?.categoryId) {
        queryClient.setQueryData(
          documentsKeys.list(context.categoryId, false),
          context.previousDocuments
        );
      }
    },

    onSettled: (data, error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: documentsKeys.list(variables.category_id, false),
      });
      queryClient.invalidateQueries({
        queryKey: documentsKeys.list(variables.category_id, true),
      });
      // Update category counts
      queryClient.invalidateQueries({ queryKey: categoriesKeys.counts() });
      queryClient.invalidateQueries({ queryKey: categoriesKeys.withCounts() });
    },
  });
};

/**
 * Hook to update an existing document
 */
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: UpdateDocumentWithAttachmentsData
    ): Promise<Document> => {
      await db.updateDocument(
        data.id,
        data.title,
        data.description,
        data.text_content,
        data.category_id
      );

      // Handle attachments if provided
      if (data.attachments) {
        // For simplicity, we'll let the UI handle attachment updates separately
        // In a full implementation, you might want to sync attachments here
      }

      const updatedDocument = await db.getDocumentById(data.id);
      if (!updatedDocument) {
        throw new Error("Failed to fetch updated document");
      }

      return updatedDocument;
    },

    onMutate: async (updatedData) => {
      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: documentsKeys.detail(updatedData.id),
      });
      await queryClient.cancelQueries({
        queryKey: documentsKeys.list(updatedData.category_id, false),
      });

      // Snapshot previous values
      const previousDocument = queryClient.getQueryData<Document>(
        documentsKeys.detail(updatedData.id)
      );
      const previousDocuments = queryClient.getQueryData<Document[]>(
        documentsKeys.list(updatedData.category_id, false)
      );

      // Optimistic update for single document
      if (previousDocument) {
        const optimisticDocument: Document = {
          ...previousDocument,
          title: updatedData.title,
          description: updatedData.description,
          text_content: updatedData.text_content,
          category_id: updatedData.category_id,
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData(
          documentsKeys.detail(updatedData.id),
          optimisticDocument
        );
      }

      // Optimistic update for document list
      if (previousDocuments) {
        const updatedDocuments = previousDocuments.map((doc) =>
          doc.id === updatedData.id
            ? { ...doc, ...updatedData, updated_at: new Date().toISOString() }
            : doc
        );

        queryClient.setQueryData(
          documentsKeys.list(updatedData.category_id, false),
          updatedDocuments
        );
      }

      return {
        previousDocument,
        previousDocuments,
        categoryId: updatedData.category_id,
      };
    },

    onError: (err, updatedData, context) => {
      // Rollback on error
      if (context?.previousDocument) {
        queryClient.setQueryData(
          documentsKeys.detail(updatedData.id),
          context.previousDocument
        );
      }
      if (context?.previousDocuments && context?.categoryId) {
        queryClient.setQueryData(
          documentsKeys.list(context.categoryId, false),
          context.previousDocuments
        );
      }
    },

    onSettled: (data, error, variables) => {
      // Refetch affected queries
      queryClient.invalidateQueries({
        queryKey: documentsKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: documentsKeys.list(variables.category_id, false),
      });
      queryClient.invalidateQueries({
        queryKey: documentsKeys.list(variables.category_id, true),
      });
    },
  });
};

/**
 * Hook to delete a document
 */
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: number): Promise<void> => {
      await db.deleteDocument(documentId);
    },

    onMutate: async (documentId) => {
      // Get the document first to know which category to update
      const documentToDelete = queryClient.getQueryData<Document>(
        documentsKeys.detail(documentId)
      );

      if (!documentToDelete) {
        // Try to find it in any cached document list
        const allCachedData = queryClient.getQueriesData<Document[]>({
          queryKey: documentsKeys.lists(),
        });

        for (const [, documents] of allCachedData) {
          if (documents) {
            const found = documents.find((doc) => doc.id === documentId);
            if (found) {
              documentToDelete = found;
              break;
            }
          }
        }
      }

      if (documentToDelete) {
        const categoryId = documentToDelete.category_id;

        // Cancel relevant queries
        await queryClient.cancelQueries({
          queryKey: documentsKeys.list(categoryId, false),
        });
        await queryClient.cancelQueries({
          queryKey: documentsKeys.list(categoryId, true),
        });

        // Optimistic update - remove from lists
        const previousDocuments = queryClient.getQueryData<Document[]>(
          documentsKeys.list(categoryId, false)
        );

        if (previousDocuments) {
          queryClient.setQueryData(
            documentsKeys.list(categoryId, false),
            previousDocuments.filter((doc) => doc.id !== documentId)
          );
        }

        const previousTreeDocuments = queryClient.getQueryData<Document[]>(
          documentsKeys.list(categoryId, true)
        );

        if (previousTreeDocuments) {
          queryClient.setQueryData(
            documentsKeys.list(categoryId, true),
            previousTreeDocuments.filter((doc) => doc.id !== documentId)
          );
        }

        return {
          documentToDelete,
          previousDocuments,
          previousTreeDocuments,
          categoryId,
        };
      }

      return { documentToDelete: null };
    },

    onError: (err, documentId, context) => {
      // Rollback on error
      if (
        context?.documentToDelete &&
        context?.previousDocuments &&
        context?.categoryId
      ) {
        queryClient.setQueryData(
          documentsKeys.list(context.categoryId, false),
          context.previousDocuments
        );
      }
      if (
        context?.documentToDelete &&
        context?.previousTreeDocuments &&
        context?.categoryId
      ) {
        queryClient.setQueryData(
          documentsKeys.list(context.categoryId, true),
          context.previousTreeDocuments
        );
      }
    },

    onSettled: (data, error, variables, context) => {
      // Invalidate queries
      queryClient.removeQueries({ queryKey: documentsKeys.detail(variables) });
      queryClient.removeQueries({
        queryKey: documentsKeys.attachments(variables),
      });

      if (context?.categoryId) {
        queryClient.invalidateQueries({
          queryKey: documentsKeys.list(context.categoryId, false),
        });
        queryClient.invalidateQueries({
          queryKey: documentsKeys.list(context.categoryId, true),
        });
      }

      // Update category counts
      queryClient.invalidateQueries({ queryKey: categoriesKeys.counts() });
      queryClient.invalidateQueries({ queryKey: categoriesKeys.withCounts() });
    },
  });
};
