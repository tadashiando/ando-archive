import React, { useState } from "react";
import {
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Card, Badge, IconButton } from "../UI";
import type { CategoryWithChildren } from "../../database";
import { getCategoryIcon } from "../../utils/categoryIcons";

interface SidebarProps {
  categories: CategoryWithChildren[];
  selectedCategory: CategoryWithChildren | null;
  onCategoryChange: (category: CategoryWithChildren) => void;
  categoryCounts?: { [key: number]: number };
  mode?: "main" | "editor" | "viewer";
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onExportCategory?: (categoryId: number) => void;
  onCreateSubcategory?: (parentCategory: CategoryWithChildren) => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  categoryCounts = {},
  mode = "main",
  onClose,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
  onExportCategory,
  onCreateSubcategory,
  className = "",
}) => {
  const { t } = useTranslation();
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );

  // Use prop value if provided, otherwise determine based on mode
  const isCollapsed =
    propIsCollapsed ?? (mode === "editor" || mode === "viewer");
  const showCounts = mode === "main" && !isCollapsed;
  const showCloseButton = mode === "viewer" && !isCollapsed;
  const showToggleButton =
    (mode === "editor" || mode === "viewer") && onToggleCollapse;

  const sidebarWidth = isCollapsed ? "w-16" : "w-80";

  const toggleCategoryExpansion = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const isExpanded = (categoryId: number) => expandedCategories.has(categoryId);

  const handleCategorySelect = (category: CategoryWithChildren) => {
    onCategoryChange(category);
  };

  const handleSubcategorySelect = (subcategory: CategoryWithChildren) => {
    // Create a full category object for subcategory
    const subcategoryWithParent: CategoryWithChildren = {
      ...subcategory,
      subcategories: [],
      documentCount: categoryCounts[subcategory.id] || 0,
      totalDocumentCount: categoryCounts[subcategory.id] || 0,
    };
    onCategoryChange(subcategoryWithParent);
  };

  return (
    <aside
      className={`
        sage-bg-dark sage-border border-r-2 transition-all duration-300 
        ${sidebarWidth} overflow-hidden flex flex-col ${className}
      `}
    >
      {/* Header da Sidebar */}
      <div className="p-3 border-b sage-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="font-bold sage-text-cream flex items-center text-xl">
              <span className="text-2xl mr-2">🗂️</span>
              {t("navigation.categories")}
            </h2>
          )}

          {isCollapsed && (
            <div className="w-full flex justify-center">
              <span className="text-2xl">🗂️</span>
            </div>
          )}

          {/* Action buttons */}
          {!isCollapsed && (
            <div className="flex items-center space-x-1">
              {showToggleButton && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  icon={<ChevronLeftIcon className="h-4 w-4" />}
                  label="Colapsar sidebar"
                />
              )}

              {showCloseButton && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  icon={<XMarkIcon className="h-4 w-4" />}
                  label={t("common.close")}
                />
              )}
            </div>
          )}
        </div>

        {/* Collapsed toggle button */}
        {isCollapsed && showToggleButton && (
          <div className="flex justify-center mt-2">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              icon={<ChevronRightIcon className="h-3 w-3" />}
              label="Expandir sidebar"
              className="sage-bg-medium hover:sage-bg-light"
            />
          </div>
        )}
      </div>

      {/* Lista de Categorias Hierárquica */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {categories.map((category) => {
          const isSelected = selectedCategory?.id === category.id;
          const hasSubcategories =
            category.subcategories && category.subcategories.length > 0;
          const expanded = isExpanded(category.id);

          return (
            <div key={category.id} className="space-y-1">
              {/* Root Category */}
              <Card
                variant={isSelected ? "selected" : "category"}
                padding={isCollapsed ? "sm" : "md"}
                onClick={() => handleCategorySelect(category)}
                className="transition-all duration-200 cursor-pointer group"
                title={isCollapsed ? category.name : undefined}
              >
                {isCollapsed ? (
                  // Collapsed mode - icon only, centered
                  <div className="flex justify-center">
                    <span className="text-xl">
                      {getCategoryIcon(category.name, category.icon)}
                    </span>
                  </div>
                ) : (
                  // Expanded mode - full layout
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* Expand/Collapse button for categories with subcategories */}
                      {hasSubcategories && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategoryExpansion(category.id);
                          }}
                          className="p-0.5 rounded hover:sage-bg-light transition-colors"
                        >
                          <ChevronDownIcon
                            className={`h-4 w-4 transition-transform duration-200 ${
                              expanded ? "transform rotate-180" : ""
                            } ${
                              isSelected ? "text-gray-800" : "sage-text-mist"
                            }`}
                          />
                        </button>
                      )}

                      {/* Category icon */}
                      <span className="text-xl flex-shrink-0">
                        {getCategoryIcon(category.name, category.icon)}
                      </span>

                      {/* Category name */}
                      <span
                        className={`font-bold text-lg truncate ${
                          isSelected ? "text-gray-800" : "sage-text-cream"
                        }`}
                      >
                        {category.name}
                      </span>
                    </div>

                    {/* Right side actions and counts */}
                    {!isCollapsed && showCounts && (
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {/* Document count badge */}
                        <Badge
                          variant={isSelected ? "default" : "primary"}
                          size="sm"
                          title={`${category.totalDocumentCount} documentos (incluindo subcategorias)`}
                        >
                          {category.totalDocumentCount || 0}
                        </Badge>

                        {/* Export button */}
                        {onExportCategory && (
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExportCategory(category.id);
                            }}
                            icon={<DocumentArrowDownIcon className="h-3 w-3" />}
                            label={t("categories.export")}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        )}

                        {/* Add subcategory button */}
                        {onCreateSubcategory && (
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateSubcategory(category);
                            }}
                            icon={<PlusIcon className="h-3 w-3" />}
                            label={t(
                              "categories.addSubcategory",
                              "Add subcategory"
                            )}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Subcategories */}
              {!isCollapsed && hasSubcategories && expanded && (
                <div className="ml-6 space-y-1">
                  {category.subcategories!.map((subcategory) => {
                    const isSubcategorySelected =
                      selectedCategory?.id === subcategory.id;
                    const subcategoryCount =
                      categoryCounts[subcategory.id] || 0;

                    return (
                      <Card
                        key={subcategory.id}
                        variant={isSubcategorySelected ? "selected" : "ghost"}
                        padding="sm"
                        onClick={() => handleSubcategorySelect(subcategory)}
                        className="transition-all duration-200 cursor-pointer group border-l-2 sage-border ml-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-sm">
                              {getCategoryIcon(
                                subcategory.name,
                                subcategory.icon
                              )}
                            </span>
                            <span
                              className={`font-medium text-sm truncate ${
                                isSubcategorySelected
                                  ? "text-gray-800"
                                  : "sage-text-cream"
                              }`}
                            >
                              {subcategory.name}
                            </span>
                          </div>

                          {showCounts && (
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <Badge
                                variant={
                                  isSubcategorySelected ? "default" : "primary"
                                }
                                size="sm"
                                className="text-xs"
                              >
                                {subcategoryCount}
                              </Badge>

                              {/* Export subcategory */}
                              {onExportCategory && (
                                <IconButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onExportCategory(subcategory.id);
                                  }}
                                  icon={
                                    <DocumentArrowDownIcon className="h-3 w-3" />
                                  }
                                  label={t("categories.export")}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Subcategory description */}
                        {subcategory.description && (
                          <p
                            className={`text-xs mt-1 truncate ${
                              isSubcategorySelected
                                ? "text-gray-600"
                                : "sage-text-mist"
                            }`}
                          >
                            {subcategory.description}
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📁</span>
            <p className="sage-text-mist">
              {t("categories.noCategories", "No categories found")}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
