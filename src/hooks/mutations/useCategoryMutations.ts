import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "../../database";
import type { Category, CategoryWithChildren } from "../../database";
import { categoriesKeys } from "../queries/useCategories";
import { documentsKeys } from "../queries/useDocuments";

interface CreateCategoryData {
  name: string;
  icon: string;
  color: string;
  parent_id?: number | null;
  description?: string | null;
}

interface UpdateCategoryData {
  id: number;
  name: string;
  icon: string;
  color: string;
  description?: string | null;
}

interface DeleteCategoryData {
  id: number;
  action: "move" | "delete";
  targetCategoryId?: number;
}

/**
 * Hook to create a new category
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryData): Promise<Category> => {
      const categoryId = await db.createCategory(
        data.name,
        data.icon,
        data.color,
        data.parent_id,
        data.description
      );

      // Fetch the created category to return it
      const newCategory = await db.getCategoryById(categoryId);
      if (!newCategory) {
        throw new Error("Failed to fetch created category");
      }
      return newCategory;
    },

    onMutate: async (newCategoryData) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: categoriesKeys.all });

      // Snapshot previous value
      const previousCategories = queryClient.getQueryData<
        CategoryWithChildren[]
      >(categoriesKeys.withCounts());

      // Optimistic update
      if (previousCategories) {
        const optimisticCategory: CategoryWithChildren = {
          id: Date.now(), // Temporary ID
          name: newCategoryData.name,
          icon: newCategoryData.icon,
          color: newCategoryData.color,
          parent_id: newCategoryData.parent_id || null,
          description: newCategoryData.description || null,
          level: newCategoryData.parent_id ? 1 : 0,
          sort_order: 0,
          created_at: new Date().toISOString(),
          subcategories: [],
          documentCount: 0,
          totalDocumentCount: 0,
        };

        if (newCategoryData.parent_id) {
          // Add as subcategory
          const updatedCategories = previousCategories.map((cat) => {
            if (cat.id === newCategoryData.parent_id) {
              return {
                ...cat,
                subcategories: [
                  ...(cat.subcategories || []),
                  optimisticCategory,
                ],
              };
            }
            return cat;
          });
          queryClient.setQueryData(
            categoriesKeys.withCounts(),
            updatedCategories
          );
        } else {
          // Add as root category
          queryClient.setQueryData(categoriesKeys.withCounts(), [
            ...previousCategories,
            optimisticCategory,
          ]);
        }
      }

      return { previousCategories };
    },

    onError: (err, newCategoryData, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(
          categoriesKeys.withCounts(),
          context.previousCategories
        );
      }
    },

    onSettled: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
      queryClient.invalidateQueries({ queryKey: categoriesKeys.counts() });
    },
  });
};

/**
 * Hook to update a category
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCategoryData): Promise<void> => {
      await db.updateCategory(
        data.id,
        data.name,
        data.icon,
        data.color,
        data.description
      );
    },

    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: categoriesKeys.all });

      const previousCategories = queryClient.getQueryData<
        CategoryWithChildren[]
      >(categoriesKeys.withCounts());

      // Optimistic update
      if (previousCategories) {
        const updateCategoryInTree = (
          categories: CategoryWithChildren[]
        ): CategoryWithChildren[] => {
          return categories.map((cat) => {
            if (cat.id === updatedData.id) {
              return { ...cat, ...updatedData };
            }
            if (cat.subcategories) {
              return {
                ...cat,
                subcategories: updateCategoryInTree(cat.subcategories),
              };
            }
            return cat;
          });
        };

        const updatedCategories = updateCategoryInTree(previousCategories);
        queryClient.setQueryData(
          categoriesKeys.withCounts(),
          updatedCategories
        );
      }

      return { previousCategories };
    },

    onError: (err, updatedData, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          categoriesKeys.withCounts(),
          context.previousCategories
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
    },
  });
};

/**
 * Hook to delete a category
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteCategoryData): Promise<void> => {
      if (data.action === "move" && data.targetCategoryId) {
        await db.moveCategoryDocuments(data.id, data.targetCategoryId);
      }
      await db.deleteCategory(data.id);
    },

    onMutate: async (deleteData) => {
      await queryClient.cancelQueries({ queryKey: categoriesKeys.all });
      await queryClient.cancelQueries({ queryKey: documentsKeys.all });

      const previousCategories = queryClient.getQueryData<
        CategoryWithChildren[]
      >(categoriesKeys.withCounts());

      // Optimistic update - remove category from tree
      if (previousCategories) {
        const removeCategoryFromTree = (
          categories: CategoryWithChildren[]
        ): CategoryWithChildren[] => {
          return categories.filter((cat) => {
            if (cat.id === deleteData.id) {
              return false; // Remove this category
            }
            if (cat.subcategories) {
              cat.subcategories = removeCategoryFromTree(cat.subcategories);
            }
            return true;
          });
        };

        const updatedCategories = removeCategoryFromTree(previousCategories);
        queryClient.setQueryData(
          categoriesKeys.withCounts(),
          updatedCategories
        );
      }

      return { previousCategories };
    },

    onError: (err, deleteData, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          categoriesKeys.withCounts(),
          context.previousCategories
        );
      }
    },

    onSettled: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
      queryClient.invalidateQueries({ queryKey: categoriesKeys.counts() });
    },
  });
};
