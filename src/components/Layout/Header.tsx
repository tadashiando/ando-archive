// src/components/Layout/Header.tsx
import React from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Button, Input, Container } from "../UI";

interface HeaderProps {
  mode?: "normal" | "editor" | "compact";
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onCreateClick?: () => void;
  onCloseClick?: () => void;
  createButtonDisabled?: boolean;
  isLoading?: boolean;

  // Props específicas do modo editor
  editorTitle?: string;
  editorSubtitle?: string;
  onSaveClick?: () => void;
  saveButtonDisabled?: boolean;
  saveButtonText?: string;
}

const Header: React.FC<HeaderProps> = ({
  mode = "normal",
  searchQuery = "",
  onSearchChange,
  onCreateClick,
  onCloseClick,
  createButtonDisabled = false,
  isLoading = false,

  // Editor props
  editorTitle,
  editorSubtitle,
  onSaveClick,
  saveButtonDisabled = false,
  saveButtonText,
}) => {
  const { t } = useTranslation();

  if (mode === "editor") {
    return (
      <header className="sage-header sage-text-white p-3 flex-shrink-0 border-b sage-border">
        <Container>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🌱</span>
              <div>
                <h2 className="text-base font-bold sage-text-white">
                  {editorTitle || t("modal.createDocument.title")}
                </h2>
                {editorSubtitle && (
                  <p className="text-xs sage-text-mist">{editorSubtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={onCloseClick}
                disabled={isLoading}
              >
                {t("common.cancel")}
              </Button>
              {onSaveClick && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onSaveClick}
                  disabled={saveButtonDisabled || isLoading}
                >
                  {saveButtonText || t("common.save")}
                </Button>
              )}
            </div>
          </div>
        </Container>
      </header>
    );
  }

  // Modo compact - header reduzido quando no editor
  if (mode === "compact") {
    return (
      <header className="sage-header sage-text-white p-3 flex-shrink-0">
        <Container>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🌲</span>
              <p className="text-sm sage-text-mist font-medium">
                {t("app.tagline")}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {onSearchChange && (
                <div className="relative">
                  <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={t("navigation.search")}
                    inputSize="sm"
                    className="w-64 pr-10"
                  />
                  <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-4 w-4 sage-text-light" />
                </div>
              )}

              {onCreateClick && (
                <Button
                  onClick={onCreateClick}
                  variant="primary"
                  size="sm"
                  disabled={createButtonDisabled}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  {t("navigation.create")}
                </Button>
              )}
            </div>
          </div>
        </Container>
      </header>
    );
  }

  // Modo normal
  return (
    <header className="sage-header sage-text-white p-6 flex-shrink-0">
      <Container>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-4xl">🌲</span>
            <div>
              <h1 className="text-2xl font-bold sage-text-white">
                {t("app.name")}
              </h1>
              <p className="text-sm sage-text-muted font-medium">
                {t("app.tagline")}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {onSearchChange && (
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t("navigation.search")}
                  inputSize="lg"
                  className="w-96 pr-12"
                />
                <MagnifyingGlassIcon className="absolute right-4 top-4 h-5 w-5 sage-text-light" />
              </div>
            )}

            {onCreateClick && (
              <Button
                onClick={onCreateClick}
                variant="primary"
                size="lg"
                disabled={createButtonDisabled}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                {t("navigation.create")}
              </Button>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
};

export default Header;
