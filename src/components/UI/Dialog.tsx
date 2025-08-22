import React, { Fragment } from "react";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Button, IconButton } from "./index";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  variant?: "default" | "danger";
  isLoading?: boolean;
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  variant = "default",
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {variant === "danger" && (
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                      </div>
                    )}
                    <div>
                      <HeadlessDialog.Title className="text-xl font-bold sage-text-white">
                        {title}
                      </HeadlessDialog.Title>
                      {description && (
                        <p className="sage-text-mist mt-2">{description}</p>
                      )}
                    </div>
                  </div>

                  <IconButton
                    variant="ghost"
                    onClick={handleClose}
                    disabled={isLoading}
                    icon={<XMarkIcon className="h-5 w-5" />}
                    label={t("common.close")}
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    {cancelText || t("common.cancel")}
                  </Button>

                  {onConfirm && (
                    <Button
                      variant={variant === "danger" ? "danger" : "primary"}
                      onClick={handleConfirm}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? t("common.loading")
                        : confirmText || t("common.save")}
                    </Button>
                  )}
                </div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
};

export default Dialog;
