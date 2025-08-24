// src/components/UI/CompactIconPicker.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { FAIcon, Input } from "./index";
import {
  CATEGORY_ICON_OPTIONS,
  type IconName,
} from "../../utils/iconConstants";

interface CompactIconPickerProps {
  selectedIcon: IconName;
  onIconSelect: (icon: IconName) => void;
  disabled?: boolean;
  placeholder?: string;
}

const CompactIconPicker: React.FC<CompactIconPickerProps> = ({
  selectedIcon,
  onIconSelect,
  disabled = false,
  placeholder,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleIconSelect = (icon: IconName) => {
    onIconSelect(icon);
    setIsOpen(false);
    setSearchTerm(""); // Clear search
    triggerRef.current?.focus();
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm(""); // Clear search when opening
      }
    }
  };

  // Get icon label from CATEGORY_ICON_OPTIONS
  const getIconLabel = (iconName: IconName): string => {
    const iconOption = CATEGORY_ICON_OPTIONS.find(
      (opt) => opt.name === iconName
    );
    return iconOption?.label || iconName;
  };

  // Filter icons based on search term
  const filteredIcons = CATEGORY_ICON_OPTIONS.filter(
    (icon) =>
      icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      {/* Dropdown Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between p-3 rounded-xl border
          sage-bg-medium sage-border transition-all duration-200
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:sage-bg-light focus:ring-2 focus:ring-green-500 focus:outline-none"
          }
          ${isOpen ? "sage-border-gold" : "sage-border"}
        `}
      >
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <FAIcon
              name={selectedIcon}
              className="sage-text-gold"
              size="1.25rem"
            />
          </div>
          <span className="sage-text-cream font-medium">
            {placeholder || getIconLabel(selectedIcon)}
          </span>
        </div>

        <ChevronDownIcon
          className={`
            h-4 w-4 sage-text-mist transition-transform duration-200
            ${isOpen ? "transform rotate-180" : ""}
          `}
        />
      </button>

      {/* Dropdown Menu - MUCH SMALLER */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 sage-bg-dark sage-border border-2 rounded-xl shadow-2xl"
          style={{ maxHeight: "280px" }} // Fixed max height
        >
          {/* Search Input */}
          <div className="p-3 border-b sage-border">
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t(
                  "categories.modal.iconPicker.searchIcons",
                  "Search icons..."
                )}
                inputSize="sm"
                className="pr-8"
                autoFocus
              />
              <MagnifyingGlassIcon className="absolute right-2 top-2 h-4 w-4 sage-text-mist" />
            </div>
          </div>

          {/* Icons Grid - Scrollable */}
          <div
            className="p-3"
            style={{ maxHeight: "200px", overflowY: "auto" }}
          >
            {filteredIcons.length > 0 ? (
              <div className="grid grid-cols-6 gap-2">
                {filteredIcons.slice(0, 24).map(
                  (
                    icon // Limit to 24 icons max
                  ) => (
                    <button
                      key={icon.name}
                      type="button"
                      onClick={() => handleIconSelect(icon.name)}
                      className={`
                      p-2 rounded-lg transition-all duration-200 
                      flex items-center justify-center aspect-square
                      ${
                        selectedIcon === icon.name
                          ? "sage-bg-gold text-gray-800"
                          : "sage-bg-medium hover:sage-bg-light sage-text-cream hover:sage-text-gold"
                      }
                    `}
                      title={icon.label}
                    >
                      <FAIcon name={icon.name} size="1.1rem" />
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="sage-text-mist text-sm">
                  {t("categories.modal.iconPicker.noResults", "No icons found")}
                </p>
              </div>
            )}
          </div>

          {/* Show count if there are more icons */}
          {filteredIcons.length > 24 && (
            <div className="px-3 pb-2">
              <p className="text-xs sage-text-mist text-center">
                {t(
                  "categories.modal.iconPicker.showingResults",
                  "Showing 24 of {{total}} icons",
                  {
                    total: filteredIcons.length,
                  }
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactIconPicker;
