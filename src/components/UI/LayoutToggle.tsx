import React from "react";
import {
  Squares2X2Icon,
  Bars3Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { IconButton } from "./index";

export type LayoutMode = "cards" | "compact" | "list";

interface LayoutToggleProps {
  currentMode: LayoutMode;
  onModeChange: (mode: LayoutMode) => void;
  disabled?: boolean;
}

const LayoutToggle: React.FC<LayoutToggleProps> = ({
  currentMode,
  onModeChange,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const layoutOptions: {
    mode: LayoutMode;
    icon: React.ReactNode;
    label: string;
  }[] = [
    {
      mode: "cards",
      icon: <Squares2X2Icon className="h-4 w-4" />,
      label: t("layout.cards"),
    },
    {
      mode: "compact",
      icon: <Bars3Icon className="h-4 w-4" />,
      label: t("layout.compact"),
    },
    {
      mode: "list",
      icon: <ListBulletIcon className="h-4 w-4" />,
      label: t("layout.list"),
    },
  ];

  return (
    <div className="flex items-center sage-bg-medium rounded-xl p-1 space-x-1">
      {layoutOptions.map(({ mode, icon, label }) => (
        <IconButton
          key={mode}
          size="sm"
          variant={currentMode === mode ? "primary" : "ghost"}
          onClick={() => !disabled && onModeChange(mode)}
          icon={icon}
          label={label}
          disabled={disabled}
          className={`
            transition-all duration-200
            ${
              currentMode === mode
                ? "sage-bg-gold text-gray-800 shadow-sm"
                : "sage-text-mist hover:sage-text-cream hover:sage-bg-light"
            }
          `}
        />
      ))}
    </div>
  );
};

export default LayoutToggle;
