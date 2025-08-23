import React, { Fragment } from "react";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Button, IconButton } from "./index";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;

  // Form handling
  onSubmit?: (e: React.FormEvent) => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;

  // Loading state
  isLoading?: boolean;

  // Size
  size?: "md" | "lg" | "xl";

  // Custom actions (overrides submit/cancel)
  customActions?: React.ReactNode;
}

const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  submitLabel,
  cancelLabel,
  submitDisabled = false,
  isLoading = false,
  size = "lg",
  customActions,
}) => {
  const { t } = useTranslation();

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  // Size classes
  const sizeClasses = {
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
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
              <HeadlessDialog.Panel
                className={`
                  w-full ${sizeClasses[size]} sage-bg-dark sage-border border-2 
                  rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto
                `}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <HeadlessDialog.Title className="text-2xl font-bold sage-text-white">
                      {title}
                    </HeadlessDialog.Title>
                    {subtitle && (
                      <p className="sage-text-mist mt-1">{subtitle}</p>
                    )}
                  </div>

                  <IconButton
                    variant="ghost"
                    onClick={handleClose}
                    disabled={isLoading}
                    icon={<XMarkIcon className="h-6 w-6" />}
                    label={t("common.close")}
                  />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {children}

                  {/* Actions */}
                  {customActions || (
                    <div className="flex justify-end space-x-4 pt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        disabled={isLoading}
                      >
                        {cancelLabel || t("common.cancel")}
                      </Button>

                      {onSubmit && (
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={submitDisabled || isLoading}
                        >
                          {isLoading
                            ? t("common.loading")
                            : submitLabel || t("common.save")}
                        </Button>
                      )}
                    </div>
                  )}
                </form>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
};

export default FormModal;
