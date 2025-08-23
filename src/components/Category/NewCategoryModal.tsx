import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import FormModal from "../UI/FormModal";
import { Input, Label, Card, FAIcon } from "../UI";
import {
  CATEGORY_ICON_OPTIONS,
  type IconName,
} from "../../utils/iconConstants";

// Predefined colors for categories
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

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreate: (
    name: string,
    icon: string,
    color: string
  ) => Promise<void>;
  existingCategories: string[]; // For validation
}

const NewCategoryModal: React.FC<NewCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreate,
  existingCategories,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<IconName>("folder");
  const [selectedColor, setSelectedColor] = useState("#6B7280");
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const validateName = (categoryName: string): boolean => {
    const trimmedName = categoryName.trim();

    if (trimmedName.length === 0) {
      setNameError(t("categories.validation.nameRequired"));
      return false;
    }

    if (trimmedName.length > 50) {
      setNameError(t("categories.validation.nameTooLong"));
      return false;
    }

    const nameExists = existingCategories.some(
      (existing) => existing.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameExists) {
      setNameError(t("categories.validation.nameAlreadyExists"));
      return false;
    }

    setNameError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateName(name)) {
      return;
    }

    setIsLoading(true);
    try {
      await onCategoryCreate(name.trim(), selectedIcon, selectedColor);
      handleClose();
    } catch (error) {
      console.error("Error creating category:", error);
      setNameError(t("categories.validation.createError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName("");
      setSelectedIcon("folder");
      setSelectedColor("#6B7280");
      setNameError(null);
      onClose();
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    // Clear error when user starts typing
    if (nameError && newName.trim().length > 0) {
      setNameError(null);
    }
  };

  // Group icons by category for better organization
  const groupedIcons = CATEGORY_ICON_OPTIONS.reduce((acc, icon) => {
    if (!acc[icon.category]) {
      acc[icon.category] = [];
    }
    acc[icon.category].push(icon);
    return acc;
  }, {} as Record<string, (typeof CATEGORY_ICON_OPTIONS)[number][]>);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("categories.modal.new.title")}
      subtitle={t("categories.modal.new.subtitle")}
      onSubmit={handleSubmit}
      submitLabel={
        isLoading
          ? t("categories.modal.new.creating")
          : t("categories.modal.new.create")
      }
      submitDisabled={!name.trim() || !!nameError}
      isLoading={isLoading}
      size="xl"
    >
      {/* Category Name */}
      <div>
        <Label required>{t("categories.modal.new.nameField")}</Label>
        <Input
          value={name}
          onChange={handleNameChange}
          placeholder={t("categories.modal.new.namePlaceholder")}
          required
          disabled={isLoading}
          className={nameError ? "border-red-500" : ""}
        />
        {nameError && <p className="text-red-400 text-sm mt-1">{nameError}</p>}
      </div>

      {/* Icon Selection */}
      <div>
        <Label>{t("categories.modal.new.iconField")}</Label>
        <div className="space-y-4">
          {Object.entries(groupedIcons).map(([category, icons]) => (
            <div key={category}>
              <h4 className="text-sm font-medium sage-text-cream mb-2 capitalize">
                {category}
              </h4>
              <div className="grid grid-cols-8 gap-2">
                {icons.map((icon) => (
                  <Card
                    key={icon.name}
                    variant="ghost"
                    padding="sm"
                    className={`
                      cursor-pointer transition-all duration-200 hover:sage-bg-light
                      ${
                        selectedIcon === icon.name
                          ? "sage-bg-gold border-sage-gold text-gray-800"
                          : "sage-bg-medium hover:sage-bg-light"
                      }
                    `}
                    onClick={() => setSelectedIcon(icon.name)}
                    title={icon.label}
                  >
                    <div className="flex justify-center">
                      <FAIcon
                        name={icon.name}
                        size="1.25rem"
                        className={
                          selectedIcon === icon.name
                            ? "text-gray-800"
                            : "sage-text-cream"
                        }
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
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
                w-8 h-8 rounded-full transition-all duration-200
                ${color.bg}
                ${
                  selectedColor === color.value
                    ? "ring-2 ring-sage-gold ring-offset-2 ring-offset-sage-dark scale-110"
                    : "hover:scale-105"
                }
              `}
              onClick={() => setSelectedColor(color.value)}
              title={color.name}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <Card variant="ghost" padding="md" className="sage-bg-medium">
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: selectedColor }}
          >
            <FAIcon name={selectedIcon} size="1.25rem" className="text-white" />
          </div>
          <div>
            <p className="font-bold sage-text-cream">
              {name || t("categories.modal.new.previewPlaceholder")}
            </p>
            <p className="text-sm sage-text-mist">
              {t("categories.modal.new.previewSubtitle")}
            </p>
          </div>
        </div>
      </Card>
    </FormModal>
  );
};

export default NewCategoryModal;
