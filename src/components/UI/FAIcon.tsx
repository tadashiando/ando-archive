import React from "react";
import { FONT_AWESOME_ICONS, type IconName } from "../../utils/iconConstants";

interface FAIconProps {
  name: IconName;
  className?: string;
  style?: "solid" | "regular";
  size?: string;
}

export const FAIcon: React.FC<FAIconProps> = ({
  name,
  className = "",
  style = "solid",
  size = "1.5rem",
}) => {
  const iconCode = FONT_AWESOME_ICONS[name];

  const faClass = style === "solid" ? "fa-solid" : "fa-regular";

  return (
    <span
      className={`fa-icon ${faClass} ${className}`}
      style={{
        fontSize: size,
        lineHeight: 1,
        display: "inline-block",
      }}
    >
      {iconCode}
    </span>
  );
};
