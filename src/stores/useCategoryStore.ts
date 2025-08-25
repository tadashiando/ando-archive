// src/stores/useCategoryStore.ts
import { create } from "zustand";
import type { Category, CategoryWithChildren } from "../database";

interface CategoryStore {
  // Current state
  categories: CategoryWithChildren[];
  selectedCategory: CategoryWithChildren | null;
  expandedCategories: Set<number>;
  categoryPath: Category[];

  // For subcategory modal
  parentCategoryForSubcategory: CategoryWithChildren | null;

  // Pending changes (for unsaved changes flow)
  pendingCategoryChange: Category | null;

  // Actions
  setCategories: (categories: CategoryWithChildren[]) => void;
  setSelectedCategory: (category: CategoryWithChildren | null) => void;

  // Category expansion (for hierarchical display)
  expandCategory: (id: number) => void;
  collapseCategory: (id: number) => void;
  toggleCategoryExpansion: (id: number) => void;
  setExpandedCategories: (expanded: Set<number>) => void;

  // Category path navigation
  setCategoryPath: (path: Category[]) => void;
  addToCategoryPath: (category: Category) => void;
  clearCategoryPath: () => void;

  // Subcategory modal management
  setParentCategoryForSubcategory: (
    category: CategoryWithChildren | null
  ) => void;

  // Pending changes management
  setPendingCategoryChange: (category: Category | null) => void;
  clearPendingCategoryChange: () => void;

  // Utility methods
  findCategoryById: (id: number) => CategoryWithChildren | null;
  getAllCategoryNames: () => string[];
  getCategoryWithSubcategories: (id: number) => CategoryWithChildren | null;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  // Initial state
  categories: [],
  selectedCategory: null,
  expandedCategories: new Set(),
  categoryPath: [],
  parentCategoryForSubcategory: null,
  pendingCategoryChange: null,

  // Basic setters
  setCategories: (categories) => set({ categories }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  // Category expansion management
  expandCategory: (id) =>
    set((state) => ({
      expandedCategories: new Set([...state.expandedCategories, id]),
    })),

  collapseCategory: (id) =>
    set((state) => {
      const newExpanded = new Set(state.expandedCategories);
      newExpanded.delete(id);
      return { expandedCategories: newExpanded };
    }),

  toggleCategoryExpansion: (id) => {
    const { expandedCategories } = get();
    if (expandedCategories.has(id)) {
      get().collapseCategory(id);
    } else {
      get().expandCategory(id);
    }
  },

  setExpandedCategories: (expanded) => set({ expandedCategories: expanded }),

  // Category path navigation
  setCategoryPath: (path) => set({ categoryPath: path }),
  addToCategoryPath: (category) =>
    set((state) => ({
      categoryPath: [...state.categoryPath, category],
    })),
  clearCategoryPath: () => set({ categoryPath: [] }),

  // Subcategory modal
  setParentCategoryForSubcategory: (category) =>
    set({ parentCategoryForSubcategory: category }),

  // Pending changes
  setPendingCategoryChange: (category) =>
    set({ pendingCategoryChange: category }),
  clearPendingCategoryChange: () => set({ pendingCategoryChange: null }),

  // Utility methods
  findCategoryById: (id) => {
    const { categories } = get();

    // Helper function to search in hierarchical structure
    const searchInCategories = (
      cats: CategoryWithChildren[]
    ): CategoryWithChildren | null => {
      for (const category of cats) {
        if (category.id === id) {
          return category;
        }

        if (category.subcategories) {
          const found = searchInCategories(category.subcategories);
          if (found) return found;
        }
      }
      return null;
    };

    return searchInCategories(categories);
  },

  getAllCategoryNames: () => {
    const { categories } = get();

    const collectNames = (cats: CategoryWithChildren[]): string[] => {
      const names: string[] = [];
      for (const cat of cats) {
        names.push(cat.name);
        if (cat.subcategories) {
          names.push(...collectNames(cat.subcategories));
        }
      }
      return names;
    };

    return collectNames(categories);
  },

  getCategoryWithSubcategories: (id) => {
    const { categories } = get();

    const searchWithSubcategories = (
      cats: CategoryWithChildren[]
    ): CategoryWithChildren | null => {
      for (const category of cats) {
        if (category.id === id) {
          return category;
        }

        // Search in subcategories
        if (category.subcategories) {
          for (const subcat of category.subcategories) {
            if (subcat.id === id) {
              // Return subcategory as full category with its potential subcategories
              return {
                ...subcat,
                subcategories: subcat.subcategories || [],
              };
            }
          }
        }
      }
      return null;
    };

    return searchWithSubcategories(categories);
  },
}));
