import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Dialog from "../UI/Dialog";
import { Card } from "../UI";
import { getCategoryIcon } from "../../utils/categoryIcons";
import type { Category } from "../../database";

interface CategorySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: Category) => void;
  categories: Category[];
}

const CategorySelectModal: React.FC<CategorySelectModalProps> = ({
  isOpen,
  onClose,
  onCategorySelect,
  categories,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const handleConfirm = () => {
    if (selectedCategory) {
      onCategorySelect(selectedCategory);
      onClose();
      setSelectedCategory(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedCategory(null);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={t("modal.selectCategory.title")}
      description={t("modal.selectCategory.subtitle")}
      size="md"
      actions={[
        {
          label: t("common.cancel"),
          onClick: handleClose,
          variant: "secondary",
        },
        {
          label: t("navigation.create"),
          onClick: handleConfirm,
          variant: "primary",
          disabled: !selectedCategory,
        },
      ]}
    >
      <div className="space-y-3 my-4">
        {categories.map((category) => (
          <Card
            key={category.id}
            variant={
              selectedCategory?.id === category.id ? "selected" : "category"
            }
            padding="md"
            onClick={() => setSelectedCategory(category)}
            className="cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-6 h-6 flex items-center justify-center"
                style={{ color: category.color }}
              >
                {getCategoryIcon(category.name, category.icon)}
              </div>
              <span
                className={`font-bold ${
                  selectedCategory?.id === category.id
                    ? "text-gray-800"
                    : "sage-text-cream"
                }`}
              >
                {category.name}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </Dialog>
  );
};

export default CategorySelectModal;
