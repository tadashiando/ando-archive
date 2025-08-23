// src-tauri/src/menu.rs - Menu Structure Fix
use tauri::{menu::*, AppHandle, Emitter, Wry};

pub fn create_app_menu(app: &AppHandle<Wry>) -> Result<Menu<Wry>, Box<dyn std::error::Error>> {
    // DOCUMENTS MENU
    let documents_menu = SubmenuBuilder::new(app, "Documents")
        .item(
            &MenuItemBuilder::new("New Document")
                .id("new_document")
                .accelerator("CmdOrCtrl+N")
                .build(app)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::new("Search Documents")
                .id("search")
                .accelerator("CmdOrCtrl+F")
                .build(app)?,
        )
        .build()?;

    // CATEGORIES MENU
    let categories_menu = SubmenuBuilder::new(app, "Categories")
        .item(
            &MenuItemBuilder::new("New Category")
                .id("new_category")
                .accelerator("CmdOrCtrl+Shift+N")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::new("Manage Categories")
                .id("manage_categories")
                .accelerator("CmdOrCtrl+Shift+M")
                .build(app)?,
        )
        .build()?;

    // FILE MENU - Operations on files/data
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(
            &MenuItemBuilder::new("Export Archive")
                .id("export_archive")
                .accelerator("CmdOrCtrl+E")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::new("Import Archive")
                .id("import_archive")
                .accelerator("CmdOrCtrl+I")
                .build(app)?,
        )
        .separator()
        .item(&MenuItemBuilder::new("Settings").id("settings").build(app)?)
        .separator()
        .item(&MenuItemBuilder::new("Quit").id("quit").build(app)?)
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(
            &MenuItemBuilder::new("Undo")
                .id("undo")
                .accelerator("CmdOrCtrl+Z")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::new("Redo")
                .id("redo")
                .accelerator("CmdOrCtrl+Shift+Z")
                .build(app)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::new("Cut")
                .id("cut")
                .accelerator("CmdOrCtrl+X")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::new("Copy")
                .id("copy")
                .accelerator("CmdOrCtrl+C")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::new("Paste")
                .id("paste")
                .accelerator("CmdOrCtrl+V")
                .build(app)?,
        )
        .build()?;

    let view_menu = SubmenuBuilder::new(app, "View")
        .item(
            &MenuItemBuilder::new("Toggle Sidebar")
                .id("toggle_sidebar")
                .accelerator("CmdOrCtrl+B")
                .build(app)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::new("Reload")
                .id("reload")
                .accelerator("CmdOrCtrl+R")
                .build(app)?,
        )
        .build()?;

    let help_menu = SubmenuBuilder::new(app, "Help")
        .item(
            &MenuItemBuilder::new("About Ando Archive")
                .id("about")
                .build(app)?,
        )
        .build()?;

    let menu = MenuBuilder::new(app)
        .item(&documents_menu) // NEW: Documents menu first
        .item(&categories_menu) // NEW: Categories menu
        .item(&file_menu) // MODIFIED: File operations
        .item(&edit_menu)
        .item(&view_menu) // MODIFIED: Removed search (moved to Documents)
        .item(&help_menu)
        .build()?;

    Ok(menu)
}

pub fn handle_menu_event(app: &AppHandle<Wry>, event: &str) {
    match event {
        // Documents
        "new_document" => {
            app.emit("menu_new_document", ()).unwrap();
        }
        "search" => {
            app.emit("menu_search", ()).unwrap();
        }

        // Categories
        "new_category" => {
            app.emit("menu_new_category", ()).unwrap();
        }
        "manage_categories" => {
            app.emit("menu_manage_categories", ()).unwrap();
        }

        // File operations
        "export_archive" => {
            app.emit("menu_export_archive", ()).unwrap();
        }
        "import_archive" => {
            app.emit("menu_import_archive", ()).unwrap();
        }
        "settings" => {
            app.emit("menu_settings", ()).unwrap();
        }
        "quit" => {
            app.exit(0);
        }

        // View
        "toggle_sidebar" => {
            app.emit("menu_toggle_sidebar", ()).unwrap();
        }
        "reload" => {
            app.emit("menu_reload", ()).unwrap();
        }

        // Help
        "about" => {
            app.emit("menu_about", ()).unwrap();
        }
        _ => {}
    }
}
