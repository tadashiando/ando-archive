import React from "react";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import type { Category } from "../../database";
import { getCategoryIcon } from "../../utils/categoryIcons";

interface CategoryBreadcrumbProps {
  categoryPath: Category[];
  onCategoryClick: (category: Category) => void;
  onHomeClick?: () => void;
  className?: string;
}

const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({
  categoryPath,
  onCategoryClick,
  onHomeClick,
  className = "",
}) => {
  const { t } = useTranslation();

  if (categoryPath.length === 0) {
    return null;
  }

  return (
    <nav
      className={`flex items-center space-x-2 ${className}`}
      aria-label="Breadcrumb"
    >
      {/* Home/Root button */}
      {onHomeClick && (
        <>
          <button
            onClick={onHomeClick}
            className="flex items-center space-x-1 text-sm sage-text-mist hover:sage-text-cream transition-colors rounded px-2 py-1 hover:sage-bg-medium"
            title={t("navigation.home", "Home")}
          >
            <HomeIcon className="h-4 w-4" />
            <span>{t("navigation.allCategories", "All Categories")}</span>
          </button>
          {categoryPath.length > 0 && (
            <ChevronRightIcon className="h-4 w-4 sage-text-mist flex-shrink-0" />
          )}
        </>
      )}

      {/* Category path */}
      {categoryPath.map((category, index) => {
        const isLast = index === categoryPath.length - 1;

        return (
          <React.Fragment key={category.id}>
            <button
              onClick={() => !isLast && onCategoryClick(category)}
              disabled={isLast}
              className={`
                flex items-center space-x-2 text-sm rounded px-2 py-1 transition-colors
                ${
                  isLast
                    ? "sage-text-cream font-medium cursor-default"
                    : "sage-text-mist hover:sage-text-cream hover:sage-bg-medium"
                }
              `}
              title={category.description || category.name}
            >
              {/* Category icon */}
              <span className="text-sm">
                {getCategoryIcon(category.name, category.icon)}
              </span>

              {/* Category name */}
              <span
                className={`
                ${isLast ? "font-medium" : ""}
                ${category.level > 0 ? "text-sm" : ""}
              `}
              >
                {category.name}
              </span>

              {/* Level indicator for subcategories */}
              {category.level > 0 && (
                <span className="text-xs sage-text-mist bg-sage-medium px-1.5 py-0.5 rounded-full">
                  {t("categories.subcategory", "Sub")}
                </span>
              )}
            </button>

            {/* Separator arrow */}
            {!isLast && (
              <ChevronRightIcon className="h-4 w-4 sage-text-mist flex-shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default CategoryBreadcrumb;
