import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

interface MenuEventHandlers {
  // Documents menu
  onNewDocument?: () => void;
  onSearch?: () => void;

  // Categories menu
  onNewCategory?: () => void;
  onManageCategories?: () => void;

  // File menu
  onExportArchive?: () => void;
  onImportArchive?: () => void;
  onSettings?: () => void;

  // View menu
  onToggleSidebar?: () => void;
  onReload?: () => void;

  // Help menu
  onAbout?: () => void;
}

export const useMenuEvents = (handlers: MenuEventHandlers) => {
  useEffect(() => {
    const unlistenPromises: Promise<() => void>[] = [];

    // Documents menu events
    if (handlers.onNewDocument) {
      unlistenPromises.push(
        listen("menu_new_document", handlers.onNewDocument)
      );
    }

    if (handlers.onSearch) {
      unlistenPromises.push(listen("menu_search", handlers.onSearch));
    }

    // Categories menu events
    if (handlers.onNewCategory) {
      unlistenPromises.push(
        listen("menu_new_category", handlers.onNewCategory)
      );
    }

    if (handlers.onManageCategories) {
      unlistenPromises.push(
        listen("menu_manage_categories", handlers.onManageCategories)
      );
    }

    // File menu events
    if (handlers.onExportArchive) {
      unlistenPromises.push(
        listen("menu_export_archive", handlers.onExportArchive)
      );
    }

    if (handlers.onImportArchive) {
      unlistenPromises.push(
        listen("menu_import_archive", handlers.onImportArchive)
      );
    }

    if (handlers.onSettings) {
      unlistenPromises.push(listen("menu_settings", handlers.onSettings));
    }

    // View menu events
    if (handlers.onToggleSidebar) {
      unlistenPromises.push(
        listen("menu_toggle_sidebar", handlers.onToggleSidebar)
      );
    }

    if (handlers.onReload) {
      unlistenPromises.push(listen("menu_reload", handlers.onReload));
    }

    // Help menu events
    if (handlers.onAbout) {
      unlistenPromises.push(listen("menu_about", handlers.onAbout));
    }

    // Cleanup function
    return () => {
      Promise.all(unlistenPromises).then((unlistenFunctions) => {
        unlistenFunctions.forEach((unlisten) => unlisten());
      });
    };
  }, [handlers]);
};
