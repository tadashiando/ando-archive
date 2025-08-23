import React, { useState, useEffect } from "react";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Dialog, Button, IconButton, Card, Input, Label, FAIcon } from "../UI";
import {
  CATEGORY_ICON_OPTIONS,
  type IconName,
} from "../../utils/iconConstants";
import { getCategoryIcon } from "../../utils/categoryIcons";
import { db } from "../../database";
import type { Category } from "../../database";

// Same colors as NewCategoryModal
const CATEGORY_COLORS = [
  { name: "Orange", value: "#EA580C", bg: "bg-orange-600" },
  { name: "Blue", value: "#2563EB", bg: "bg-blue-600" },
  { name: "Green", value: "#059669", bg: "bg-green-600" },
  { name: "Purple", value: "#7C3AED", bg: "bg-purple-600" },
  { name: "Pink", value: "#DB2777", bg: "bg-pink-600" },
  { name: "Yellow", value: "#D97706", bg: "bg-yellow-600" },
  { name: "Red", value: "#DC2626", bg: "bg-red-600" },
  { name: "Indigo", value: "#4F46E5", bg: "bg-indigo-600" },
  { name: "Teal", value: "#0D9488", bg: "bg-teal-600" },
  { name: "Gray", value: "#6B7280", bg: "bg-gray-600" },
];

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCategoryUpdate: () => void;
  onNewCategory: () => void;
}

type EditingCategory = Category & {
  newName: string;
  newIcon: string;
  newColor: string;
  isEditing: boolean;
  hasChanges: boolean;
  documentCount?: number;
};

type DeleteStep = "confirm" | "choose-action" | "select-target";

interface DeleteDialogState {
  category: EditingCategory;
  step: DeleteStep;
  selectedAction?: "move" | "delete";
  targetCategoryId?: number;
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoryUpdate,
  onNewCategory,
}) => {
  const { t } = useTranslation();
  const [editingCategories, setEditingCategories] = useState<EditingCategory[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(
    null
  );

  // Initialize editing state when dialog opens or categories change
  useEffect(() => {
    if (isOpen) {
      loadCategoriesWithCounts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, categories]);

  const loadCategoriesWithCounts = async () => {
    try {
      const counts = await db.getAllCategoryDocumentCounts();
      const editingCats: EditingCategory[] = categories.map((cat) => ({
        ...cat,
        newName: cat.name,
        newIcon: cat.icon,
        newColor: cat.color,
        isEditing: false,
        hasChanges: false,
        documentCount: counts[cat.id] || 0,
      }));
      setEditingCategories(editingCats);
    } catch (error) {
      console.error("Error loading category counts:", error);
      const editingCats: EditingCategory[] = categories.map((cat) => ({
        ...cat,
        newName: cat.name,
        newIcon: cat.icon,
        newColor: cat.color,
        isEditing: false,
        hasChanges: false,
        documentCount: 0,
      }));
      setEditingCategories(editingCats);
    }
  };

  const startEditing = (categoryId: number) => {
    setEditingCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, isEditing: true } : cat
      )
    );
  };

  const cancelEditing = (categoryId: number) => {
    setEditingCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              isEditing: false,
              hasChanges: false,
              newName: cat.name,
              newIcon: cat.icon,
              newColor: cat.color,
            }
          : cat
      )
    );
  };

  const updateEditingCategory = (
    categoryId: number,
    field: string,
    value: string
  ) => {
    setEditingCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;

        const updated = { ...cat, [field]: value };
        updated.hasChanges =
          updated.newName !== cat.name ||
          updated.newIcon !== cat.icon ||
          updated.newColor !== cat.color;

        return updated;
      })
    );
  };

  const saveCategory = async (categoryId: number) => {
    const category = editingCategories.find((cat) => cat.id === categoryId);
    if (!category || !category.hasChanges) return;

    const trimmedName = category.newName.trim();
    if (!trimmedName) return;

    const nameExists = editingCategories.some(
      (cat) =>
        cat.id !== categoryId &&
        cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) return;

    setIsLoading(true);
    try {
      await db.updateCategory(
        categoryId,
        trimmedName,
        category.newIcon,
        category.newColor
      );

      setEditingCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                name: trimmedName,
                icon: category.newIcon,
                color: category.newColor,
                isEditing: false,
                hasChanges: false,
              }
            : cat
        )
      );

      onCategoryUpdate();
    } catch (error) {
      console.error("Error updating category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (category: EditingCategory) => {
    if (category.documentCount === 0) {
      setDeleteDialog({
        category,
        step: "confirm",
      });
    } else {
      setDeleteDialog({
        category,
        step: "choose-action",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;

    setIsLoading(true);
    try {
      let targetCategoryId: number | undefined;

      if (
        deleteDialog.selectedAction === "move" &&
        deleteDialog.targetCategoryId
      ) {
        targetCategoryId = deleteDialog.targetCategoryId;
      }

      await db.deleteCategory(deleteDialog.category.id, targetCategoryId);

      setEditingCategories((prev) =>
        prev.filter((cat) => cat.id !== deleteDialog.category.id)
      );

      onCategoryUpdate();
      setDeleteDialog(null);
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableTargetCategories = () => {
    if (!deleteDialog) return [];
    return editingCategories.filter(
      (cat) => cat.id !== deleteDialog.category.id
    );
  };

  // Group icons by category for icon selector
  const groupedIcons = CATEGORY_ICON_OPTIONS.reduce((acc, icon) => {
    if (!acc[icon.category]) {
      acc[icon.category] = [];
    }
    acc[icon.category].push(icon);
    return acc;
  }, {} as Record<string, (typeof CATEGORY_ICON_OPTIONS)[number][]>);

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={t("categories.manage")}
        description={t("categories.modal.edit.subtitle")}
        size="xl"
        showCloseButton={true}
        closeOnOverlayClick={!isLoading}
      >
        {/* Add New Category Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            size="sm"
            onClick={onNewCategory}
            disabled={isLoading}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t("categories.modal.new.title")}
          </Button>
        </div>

        {/* Categories List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {editingCategories.map((category) => (
            <Card
              key={category.id}
              variant="ghost"
              padding="lg"
              className="sage-bg-medium"
            >
              {category.isEditing ? (
                /* Edit Mode */
                <div className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <Label required>
                      {t("categories.modal.new.nameField")}
                    </Label>
                    <Input
                      value={category.newName}
                      onChange={(e) =>
                        updateEditingCategory(
                          category.id,
                          "newName",
                          e.target.value
                        )
                      }
                      placeholder={t("categories.modal.new.namePlaceholder")}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <Label>{t("categories.modal.new.iconField")}</Label>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="grid grid-cols-10 gap-2">
                        {Object.values(groupedIcons)
                          .flat()
                          .map((icon) => (
                            <Card
                              key={icon.name}
                              variant="ghost"
                              padding="sm"
                              className={`
                              cursor-pointer transition-all duration-200 hover:sage-bg-light
                              ${
                                category.newIcon === icon.name
                                  ? "sage-bg-gold border-sage-gold"
                                  : "sage-bg-dark hover:sage-bg-light"
                              }
                            `}
                              onClick={() =>
                                updateEditingCategory(
                                  category.id,
                                  "newIcon",
                                  icon.name
                                )
                              }
                              title={icon.label}
                            >
                              <div className="flex justify-center">
                                <FAIcon
                                  name={icon.name as IconName}
                                  size="1rem"
                                  className={
                                    category.newIcon === icon.name
                                      ? "text-gray-800"
                                      : "sage-text-cream"
                                  }
                                />
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <Label>{t("categories.modal.new.colorField")}</Label>
                    <div className="grid grid-cols-10 gap-2">
                      {CATEGORY_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`
                            w-6 h-6 rounded-full transition-all duration-200
                            ${color.bg}
                            ${
                              category.newColor === color.value
                                ? "ring-2 ring-sage-gold ring-offset-2 ring-offset-sage-medium scale-110"
                                : "hover:scale-105"
                            }
                          `}
                          onClick={() =>
                            updateEditingCategory(
                              category.id,
                              "newColor",
                              color.value
                            )
                          }
                          disabled={isLoading}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Edit Actions */}
                  <div className="flex justify-end space-x-3 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => cancelEditing(category.id)}
                      disabled={isLoading}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveCategory(category.id)}
                      disabled={
                        isLoading ||
                        !category.hasChanges ||
                        !category.newName.trim()
                      }
                    >
                      {t("categories.modal.edit.save")}
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <div className="text-white">
                        {getCategoryIcon(category.name, category.icon)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold sage-text-cream">
                        {category.name}
                      </h3>
                      <p className="text-sm sage-text-mist">
                        {t("categories.documentsCount", {
                          count: category.documentCount || 0,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(category.id)}
                      disabled={isLoading}
                      icon={<PencilIcon className="h-4 w-4" />}
                      label={t("categories.actions.edit")}
                    />
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(category)}
                      disabled={isLoading}
                      icon={<TrashIcon className="h-4 w-4" />}
                      label={t("categories.actions.delete")}
                      className="hover:bg-red-600/20 hover:text-red-400"
                    />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {editingCategories.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">📁</span>
            <p className="sage-text-mist">No categories found</p>
          </div>
        )}
      </Dialog>

      {/* Delete Dialogs */}
      {deleteDialog && deleteDialog.step === "confirm" && (
        <Dialog
          isOpen={true}
          onClose={() => setDeleteDialog(null)}
          title={t("categories.modal.delete.title")}
          description={t("categories.modal.delete.confirmMessage", {
            name: deleteDialog.category.name,
          })}
          variant="danger"
          size="md"
          isLoading={isLoading}
          actions={[
            {
              label: t("common.cancel"),
              onClick: () => setDeleteDialog(null),
              variant: "secondary",
              disabled: isLoading,
            },
            {
              label: isLoading
                ? t("categories.modal.delete.deleting")
                : t("categories.modal.delete.confirmDelete"),
              onClick: confirmDelete,
              variant: "danger",
              disabled: isLoading,
            },
          ]}
        />
      )}

      {deleteDialog && deleteDialog.step === "choose-action" && (
        <Dialog
          isOpen={true}
          onClose={() => setDeleteDialog(null)}
          title={t("categories.modal.delete.title")}
          description={t("categories.modal.delete.documentsWarning", {
            count: deleteDialog.category.documentCount,
          })}
          variant="danger"
          size="md"
        >
          <div className="space-y-3 my-4">
            <Card
              variant="ghost"
              padding="md"
              className={`cursor-pointer transition-all ${
                deleteDialog.selectedAction === "move"
                  ? "sage-bg-gold border-sage-gold text-gray-800"
                  : "sage-bg-medium hover:sage-bg-light"
              }`}
              onClick={() =>
                setDeleteDialog({
                  ...deleteDialog,
                  selectedAction: "move",
                  step: "select-target",
                })
              }
            >
              <p className="font-medium">
                {t("categories.modal.delete.moveToCategory")}
              </p>
            </Card>

            <Card
              variant="ghost"
              padding="md"
              className={`cursor-pointer transition-all ${
                deleteDialog.selectedAction === "delete"
                  ? "bg-red-600/20 border-red-500 text-red-400"
                  : "sage-bg-medium hover:sage-bg-light hover:bg-red-600/10"
              }`}
              onClick={() =>
                setDeleteDialog({
                  ...deleteDialog,
                  selectedAction: "delete",
                  step: "confirm",
                })
              }
            >
              <p className="font-medium">
                {t("categories.modal.delete.deleteDocuments")}
              </p>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteDialog(null)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </Dialog>
      )}

      {deleteDialog && deleteDialog.step === "select-target" && (
        <Dialog
          isOpen={true}
          onClose={() => setDeleteDialog(null)}
          title={t("categories.modal.delete.title")}
          description={t("categories.modal.delete.selectTargetCategory")}
          variant="danger"
          size="md"
          isLoading={isLoading}
          actions={[
            {
              label: t("common.cancel"),
              onClick: () =>
                setDeleteDialog({
                  ...deleteDialog,
                  step: "choose-action",
                  targetCategoryId: undefined,
                }),
              variant: "secondary",
              disabled: isLoading,
            },
            {
              label: isLoading
                ? t("categories.modal.delete.deleting")
                : t("categories.modal.delete.confirmDelete"),
              onClick: confirmDelete,
              variant: "primary",
              disabled: isLoading || !deleteDialog.targetCategoryId,
            },
          ]}
        >
          <div className="space-y-2 max-h-32 overflow-y-auto my-4">
            {getAvailableTargetCategories().map((targetCategory) => (
              <Card
                key={targetCategory.id}
                variant="ghost"
                padding="sm"
                className={`cursor-pointer transition-all ${
                  deleteDialog.targetCategoryId === targetCategory.id
                    ? "sage-bg-gold border-sage-gold text-gray-800"
                    : "sage-bg-medium hover:sage-bg-light"
                }`}
                onClick={() =>
                  setDeleteDialog({
                    ...deleteDialog,
                    targetCategoryId: targetCategory.id,
                  })
                }
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: targetCategory.color }}
                  >
                    <div className="text-white text-sm">
                      {getCategoryIcon(
                        targetCategory.name,
                        targetCategory.icon
                      )}
                    </div>
                  </div>
                  <span className="font-medium">{targetCategory.name}</span>
                </div>
              </Card>
            ))}
          </div>
        </Dialog>
      )}
    </>
  );
};

export default CategoryManagementModal;
