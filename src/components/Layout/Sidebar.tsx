import React from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import type { CategoryWithChildren } from "../../database";
import { getCategoryIcon } from "../../utils/categoryIcons";
import {
  useSidebarManager,
  useCategoryManager,
} from "../../hooks/useCompositeHooks";

interface SidebarProps {
  // Remove all the props that were being passed down
  // The component will get data from stores directly
  visible: boolean;
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ visible, collapsed }) => {
  const { t } = useTranslation();

  // Use composite hooks instead of props
  const {
    categories,
    selectedCategory,
    expandedCategories,
    setSelectedCategory,
    toggleCategoryExpansion,
  } = useSidebarManager();

  const { openSubcategoryModal } = useCategoryManager();

  if (!visible) return null;

  const handleCategoryClick = (category: CategoryWithChildren) => {
    setSelectedCategory(category);
  };

  const handleAddSubcategory = (
    e: React.MouseEvent,
    parentCategory: CategoryWithChildren
  ) => {
    e.stopPropagation();
    openSubcategoryModal(parentCategory);
  };

  const handleToggleExpansion = (e: React.MouseEvent, categoryId: number) => {
    e.stopPropagation();
    toggleCategoryExpansion(categoryId);
  };

  const renderCategory = (
    category: CategoryWithChildren,
    level: number = 0
  ) => {
    const isSelected = selectedCategory?.id === category.id;
    const isExpanded = expandedCategories.has(category.id);
    const hasSubcategories =
      category.subcategories && category.subcategories.length > 0;

    return (
      <div key={category.id}>
        <div
          className={`
            flex items-center px-3 py-2 cursor-pointer rounded-lg mx-2 mb-1
            transition-colors duration-150
            ${
              isSelected
                ? "sage-bg-accent-soft sage-text-accent-bright"
                : "sage-text-mist hover:sage-bg-soft hover:sage-text-cream"
            }
            ${level > 0 ? "ml-6" : ""}
          `}
          onClick={() => handleCategoryClick(category)}
          style={{ paddingLeft: collapsed ? "12px" : `${12 + level * 20}px` }}
        >
          {/* Expansion chevron */}
          {hasSubcategories && !collapsed && (
            <button
              className="mr-2 p-0.5 hover:sage-bg-medium rounded transition-colors"
              onClick={(e) => handleToggleExpansion(e, category.id)}
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3" />
              ) : (
                <ChevronRightIcon className="w-3 h-3" />
              )}
            </button>
          )}

          {/* Category icon */}
          <div
            className="w-5 h-5 mr-3 flex-shrink-0"
            style={{ color: isSelected ? undefined : category.color }}
          >
            {getCategoryIcon(category.icon)}
          </div>

          {/* Category name and count */}
          {!collapsed && (
            <>
              <span className="flex-1 truncate font-medium text-sm">
                {category.name}
              </span>

              {/* Document count */}
              {(category.documentCount || 0) > 0 && (
                <span className="text-xs sage-text-mist bg-sage-600/30 px-2 py-0.5 rounded-full ml-2">
                  {category.documentCount}
                </span>
              )}

              {/* Add subcategory button */}
              {level === 0 && (
                <button
                  className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:sage-bg-medium rounded transition-all"
                  onClick={(e) => handleAddSubcategory(e, category)}
                  title={t("categories.addSubcategory")}
                >
                  <PlusIcon className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Render subcategories */}
        {hasSubcategories && isExpanded && !collapsed && (
          <div className="mb-1">
            {category.subcategories!.map((subcategory) =>
              renderCategory(subcategory, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`
        fixed left-0 top-16 bottom-0 z-30 transition-all duration-200
        sage-bg-medium border-r sage-border
        ${collapsed ? "w-16" : "w-80"}
      `}
    >
      {/* Categories Header */}
      {!collapsed && (
        <div className="p-4 border-b sage-border">
          <h2 className="text-sm font-semibold sage-text-cream uppercase tracking-wider">
            {t("navigation.categories")}
          </h2>
        </div>
      )}

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto py-2">
        {categories.length === 0 ? (
          !collapsed && (
            <div className="p-4 text-center">
              <FolderIcon className="w-8 h-8 mx-auto sage-text-mist mb-2" />
              <p className="text-sm sage-text-mist">
                {t("categories.noCategories")}
              </p>
            </div>
          )
        ) : (
          <div className="space-y-1">
            {categories.map((category) => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Collapsed state indicator */}
      {collapsed && (
        <div className="p-2 border-t sage-border">
          <div className="w-3 h-3 mx-auto sage-text-mist">
            <FolderIcon />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
