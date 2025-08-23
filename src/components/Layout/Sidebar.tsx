import React from "react";
import {
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Card, Badge, IconButton } from "../UI";
import type { Category } from "../../database";
import { getCategoryIcon } from "../../utils/categoryIcons";

interface SidebarProps {
  categories: Category[];
  selectedCategory: Category | null;
  onCategoryChange: (category: Category) => void;
  categoryCounts?: { [key: number]: number };
  mode?: "main" | "editor" | "viewer";
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  className = "",
}) => {
  const { t } = useTranslation();

  // Use prop value if provided, otherwise determine based on mode
  const isCollapsed =
    propIsCollapsed ?? (mode === "editor" || mode === "viewer");
  const showCounts = mode === "main" && !isCollapsed;
  const showCloseButton = mode === "viewer" && !isCollapsed;
  const showToggleButton =
    (mode === "editor" || mode === "viewer") && onToggleCollapse;

  const sidebarWidth = isCollapsed ? "w-16" : "w-80";

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

        {/* Collapsed toggle button - positioned at bottom of header */}
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

      {/* Lista de Categorias */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {categories.map((category) => {
          const isSelected = selectedCategory?.id === category.id;
          const docCount = categoryCounts[category.id] || 0;

          return (
            <Card
              key={category.id}
              variant={isSelected ? "selected" : "category"}
              padding={isCollapsed ? "sm" : "md"}
              onClick={() => onCategoryChange(category)}
              className="transition-all duration-200 cursor-pointer"
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
                // Expanded mode - icon + text + count (if main mode)
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {getCategoryIcon(category.name, category.icon)}
                    </span>
                    <span
                      className={`font-bold text-lg ${
                        isSelected ? "text-gray-800" : "sage-text-cream"
                      }`}
                    >
                      {category.name}
                    </span>
                  </div>

                  {showCounts && (
                    <Badge
                      variant={isSelected ? "default" : "primary"}
                      size="sm"
                    >
                      {docCount}
                    </Badge>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
