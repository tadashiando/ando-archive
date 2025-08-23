import React from "react";
import { useTranslation } from "react-i18next";
import Dialog from "./Dialog";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void;
  isLoading?: boolean;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onClose,
  onDiscard,
  onSave,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t("editor.unsavedChangesTitle")}
      description={t("editor.unsavedChangesDescription")}
      variant="warning"
      size="md"
      isLoading={isLoading}
      actions={[
        {
          label: t("editor.discardChanges"),
          onClick: onDiscard,
          variant: "danger",
          disabled: isLoading,
        },
        {
          label: t("common.cancel"),
          onClick: onClose,
          variant: "secondary",
          disabled: isLoading,
        },
        {
          label: t("editor.saveAndContinue"),
          onClick: onSave,
          variant: "primary",
          disabled: isLoading,
        },
      ]}
    />
  );
};

export default UnsavedChangesModal;
