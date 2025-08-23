import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

interface MenuEventHandlers {
  onNewDocument?: () => void;
  onNewCategory?: () => void;
  onSettings?: () => void;
  onToggleSidebar?: () => void;
  onSearch?: () => void;
  onReload?: () => void;
  onAbout?: () => void;
}

export const useMenuEvents = (handlers: MenuEventHandlers) => {
  useEffect(() => {
    const unlistenPromises: Promise<() => void>[] = [];

    // Listen to menu events
    if (handlers.onNewDocument) {
      unlistenPromises.push(
        listen("menu_new_document", handlers.onNewDocument)
      );
    }

    if (handlers.onNewCategory) {
      unlistenPromises.push(
        listen("menu_new_category", handlers.onNewCategory)
      );
    }

    if (handlers.onSettings) {
      unlistenPromises.push(listen("menu_settings", handlers.onSettings));
    }

    if (handlers.onToggleSidebar) {
      unlistenPromises.push(
        listen("menu_toggle_sidebar", handlers.onToggleSidebar)
      );
    }

    if (handlers.onSearch) {
      unlistenPromises.push(listen("menu_search", handlers.onSearch));
    }

    if (handlers.onReload) {
      unlistenPromises.push(listen("menu_reload", handlers.onReload));
    }

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
