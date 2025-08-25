import { useQuery } from "@tanstack/react-query";
import { db } from "../../database";
import type { CategoryWithChildren } from "../../database";

// Query keys factory for categories
export const categoriesKeys = {
  all: ["categories"] as const,
  lists: () => [...categoriesKeys.all, "list"] as const,
  list: (filters: string) => [...categoriesKeys.lists(), filters] as const,
  withCounts: () => [...categoriesKeys.all, "withCounts"] as const,
  counts: () => [...categoriesKeys.all, "counts"] as const,
} as const;

/**
 * Hook to fetch all categories with hierarchical structure
 */
export const useCategories = () => {
  return useQuery({
    queryKey: categoriesKeys.withCounts(),
    queryFn: async (): Promise<CategoryWithChildren[]> => {
      const categories = await db.getCategoriesWithSubcategories();
      return categories;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
    gcTime: 15 * 60 * 1000, // 15 minutes cache time
  });
};

/**
 * Hook to fetch document counts for all categories
 */
export const useCategoryCounts = () => {
  return useQuery({
    queryKey: categoriesKeys.counts(),
    queryFn: async (): Promise<Record<number, number>> => {
      const counts = await db.getAllCategoryDocumentCounts();
      return counts;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - counts can change more frequently
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to fetch a specific category by ID
 */
export const useCategory = (categoryId: number | null) => {
  return useQuery({
    queryKey: [...categoriesKeys.all, "detail", categoryId],
    queryFn: async (): Promise<CategoryWithChildren | null> => {
      if (!categoryId) return null;
      const category = await db.getCategoryById(categoryId);
      return category;
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};
