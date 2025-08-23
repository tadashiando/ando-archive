import React, { Fragment, useState } from "react";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Button, IconButton, Card } from "./index";
import type { Category } from "../../database";

interface CategorySelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: Category) => void;
  categories: Category[];
}

const CategorySelectDialog: React.FC<CategorySelectDialogProps> = ({
  isOpen,
  onClose,
  onCategorySelect,
  categories,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

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
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel className="w-full max-w-md sage-bg-dark sage-border border-2 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <HeadlessDialog.Title className="text-xl font-bold sage-text-white">
                      {t("modal.selectCategory.title")}
                    </HeadlessDialog.Title>
                    <p className="sage-text-mist mt-1">
                      {t("modal.selectCategory.subtitle")}
                    </p>
                  </div>

                  <IconButton
                    variant="ghost"
                    onClick={handleClose}
                    icon={<XMarkIcon className="h-5 w-5" />}
                    label={t("common.close")}
                  />
                </div>

                <div className="space-y-3 mb-6">
                  {categories.map((category) => (
                    <Card
                      key={category.id}
                      variant={
                        selectedCategory?.id === category.id
                          ? "selected"
                          : "category"
                      }
                      padding="md"
                      onClick={() => setSelectedCategory(category)}
                      className="cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">
                          {getCategoryIcon(category.name)}
                        </span>
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

                <div className="flex justify-end space-x-3">
                  <Button variant="secondary" onClick={handleClose}>
                    {t("common.cancel")}
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={!selectedCategory}
                  >
                    {t("navigation.create")}
                  </Button>
                </div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
};

export default CategorySelectDialog;
