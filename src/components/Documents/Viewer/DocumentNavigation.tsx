import React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Card, IconButton } from "../../UI";
import type { Category } from "../../../database";
import { getCategoryIcon } from "../../../utils/categoryIcons";

interface DocumentNavigationProps {
  categories: Category[];
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
  currentIndex: number;
  totalDocuments: number;
  onNavigateDocument: (direction: "prev" | "next") => void;
  onClose: () => void;
}

const DocumentNavigation: React.FC<DocumentNavigationProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  currentIndex,
  totalDocuments,
  onNavigateDocument,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <aside className="w-80 sage-bg-dark sage-border border-r-2 p-6 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold sage-text-cream flex items-center">
          <span className="text-xl mr-2">🗂️</span>
          {t("navigation.categories")}
        </h3>
        <IconButton
          variant="ghost"
          onClick={onClose}
          icon={<XMarkIcon className="h-5 w-5" />}
          label={t("common.close")}
        />
      </div>

      {/* Lista de Categorias */}
      <div className="space-y-2">
        {categories.map((category) => {
          const isSelected = selectedCategory.id === category.id;

          return (
            <Card
              key={category.id}
              variant={isSelected ? "selected" : "category"}
              padding="md"
              onClick={() => onCategoryChange(category)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">
                  {getCategoryIcon(category.name, category.icon)}
                </span>
                <span
                  className={`font-bold text-sm ${
                    isSelected ? "text-gray-800" : "sage-text-cream"
                  }`}
                >
                  {category.name}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Navegação entre documentos */}
      <div className="border-t sage-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm sage-text-mist">
            {currentIndex + 1} de {totalDocuments}
          </p>
          <div className="flex space-x-1">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => onNavigateDocument("prev")}
              disabled={currentIndex <= 0}
              icon={<ChevronLeftIcon className="h-4 w-4" />}
              label="Documento anterior"
            />
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => onNavigateDocument("next")}
              disabled={currentIndex >= totalDocuments - 1}
              icon={<ChevronRightIcon className="h-4 w-4" />}
              label="Próximo documento"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DocumentNavigation;
