// src/utils/categoryIcons.tsx
import React from "react";
import { FAIcon } from "../components/UI/FAICon";
import { FONT_AWESOME_ICONS, type IconName } from "./iconConstants";

// Helper function to get icon for existing categories
export const getCategoryIcon = (
  categoryName: string,
  iconName?: string
): React.ReactNode => {
  // If we have a specific icon name from database, use it
  if (iconName && iconName in FONT_AWESOME_ICONS) {
    return <FAIcon name={iconName as IconName} />;
  }

  // Fallback to category name matching
  switch (categoryName.toLowerCase()) {
    case "receitas":
    case "recipes":
      return <FAIcon name="utensils" />;
    case "construção":
    case "construction":
      return <FAIcon name="hammer" />;
    case "arquitetura":
    case "architecture":
      return <FAIcon name="drafting-compass" />;
    case "educação":
    case "education":
      return <FAIcon name="graduation-cap" />;
    default:
      return <FAIcon name="folder" />;
  }
};
