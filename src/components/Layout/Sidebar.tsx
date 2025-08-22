import React, { useState } from "react";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Button, Card, Badge, IconButton } from "../UI";
import type { Category } from "../../database";

interface SidebarProps {
  categories: Category[];
  selectedCategory: Category | null;
  onCategoryChange: (category: Category) => void;
  onNewCategory?: () => void;
  categoryCounts?: { [key: number]: number };
  mode?: "normal" | "editor";
  isCollapsible?: boolean;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  onNewCategory,
  categoryCounts = {},
  mode = "normal",
  isCollapsible = false,
  className = "",
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case "Receitas":
      case "Recipes":
        return "🌿";
      case "Construção":
      case "Construction":
        return "🏡";
      case "Arquitetura":
      case "Architecture":
        return "🏛️";
      case "Educação":
      case "Education":
        return "📚";
      default:
        return "📁";
    }
  };

  const sidebarWidth = isCollapsed ? "w-16" : "w-80";
  const showCounts = mode === "normal" && !isCollapsed;
  const showNewCategoryButton =
    mode === "normal" && !isCollapsed && onNewCategory;

  return (
    <aside
      className={`
      sage-bg-dark sage-border border-r-2 transition-all duration-300 
      ${sidebarWidth} overflow-hidden flex flex-col ${className}
    `}
    >
      {/* Header da Sidebar */}
      <div className="p-3 border-b sage-border flex items-center justify-between">
        {!isCollapsed && (
          <h2
            className={`font-bold sage-text-cream flex items-center ${
              mode === "editor" ? "text-base" : "text-xl"
            }`}
          >
            <span
              className={`mr-2 ${mode === "editor" ? "text-xl" : "text-2xl"}`}
            >
              🗂️
            </span>
            {t("navigation.categories")}
          </h2>
        )}

        {isCollapsible && (
          <IconButton
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={
              isCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )
            }
            label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          />
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
                // Modo colapsado - só ícone
                <div className="flex justify-center">
                  <span className="text-xl">
                    {getCategoryIcon(category.name)}
                  </span>
                </div>
              ) : (
                // Modo expandido - ícone + texto + contador
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {getCategoryIcon(category.name)}
                    </span>
                    <span
                      className={`font-bold ${
                        mode === "editor" ? "text-sm" : "text-lg"
                      } ${isSelected ? "text-gray-800" : "sage-text-cream"}`}
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

      {/* Botão Nova Categoria - só no modo normal */}
      {showNewCategoryButton && (
        <div className="p-3 border-t sage-border">
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={onNewCategory}
          >
            <PlusIcon className="h-5 w-5 mr-3" />
            {t("navigation.newCategory")}
          </Button>
        </div>
      )}

      {/* Versão colapsada do botão nova categoria */}
      {mode === "normal" && isCollapsed && onNewCategory && (
        <div className="p-2">
          <IconButton
            variant="secondary"
            onClick={onNewCategory}
            icon={<PlusIcon className="h-5 w-5" />}
            label={t("navigation.newCategory")}
            className="w-full"
          />
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
