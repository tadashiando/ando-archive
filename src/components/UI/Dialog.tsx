import React, { Fragment } from "react";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Button, IconButton } from "./index";

interface DialogAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;

  // Icon and styling
  variant?: "default" | "danger" | "warning" | "info" | "success";
  size?: "sm" | "md" | "lg" | "xl";

  // Actions - flexible button system
  actions?: DialogAction[];

  // Legacy props for backward compatibility
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;

  // Loading state
  isLoading?: boolean;

  // Custom close button
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  variant = "default",
  size = "md",
  actions,
  confirmText,
  cancelText,
  onConfirm,
  isLoading = false,
  showCloseButton = true,
  closeOnOverlayClick = true,
}) => {
  const { t } = useTranslation();

  const handleClose = () => {
    if (!isLoading && closeOnOverlayClick) {
      onClose();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  // Icon for different variants
  const getVariantIcon = () => {
    switch (variant) {
      case "danger":
        return (
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
        );
      case "warning":
        return (
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
          </div>
        );
      case "info":
        return (
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <InformationCircleIcon className="h-6 w-6 text-blue-600" />
          </div>
        );
      case "success":
        return (
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
        );
      default:
        return null;
    }
  };

  // Build actions array from legacy props or use provided actions
  const dialogActions =
    actions ||
    (() => {
      const actionList: DialogAction[] = [];

      if (cancelText || onConfirm) {
        actionList.push({
          label: cancelText || t("common.cancel"),
          onClick: onClose,
          variant: "secondary",
          disabled: isLoading,
        });
      }

      if (onConfirm) {
        actionList.push({
          label: confirmText || t("common.save"),
          onClick: onConfirm,
          variant: variant === "danger" ? "danger" : "primary",
          disabled: isLoading,
        });
      }

      return actionList;
    })();

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
                  rounded-2xl p-6 shadow-2xl
                  ${size === "xl" ? "max-h-[90vh] overflow-y-auto" : ""}
                `}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1">
                    {getVariantIcon()}
                    <div className="flex-1">
                      <HeadlessDialog.Title className="text-xl font-bold sage-text-white">
                        {title}
                      </HeadlessDialog.Title>
                      {description && (
                        <p className="sage-text-mist mt-2">{description}</p>
                      )}
                    </div>
                  </div>

                  {showCloseButton && (
                    <IconButton
                      variant="ghost"
                      onClick={onClose}
                      disabled={isLoading}
                      icon={<XMarkIcon className="h-5 w-5" />}
                      label={t("common.close")}
                    />
                  )}
                </div>

                {/* Content */}
                {children && <div className="mb-6">{children}</div>}

                {/* Actions */}
                {dialogActions.length > 0 && (
                  <div className="flex justify-end space-x-3 mt-6">
                    {dialogActions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || "secondary"}
                        onClick={action.onClick}
                        disabled={action.disabled || isLoading}
                      >
                        {isLoading && index === dialogActions.length - 1
                          ? t("common.loading")
                          : action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
};

export default Dialog;
