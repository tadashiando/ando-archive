use tauri::{menu::*, AppHandle, Emitter, Wry};

pub fn create_app_menu(app: &AppHandle<Wry>) -> Result<Menu<Wry>, Box<dyn std::error::Error>> {
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(
            &MenuItemBuilder::new("New Document")
                .id("new_document")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::new("New Category")
                .id("new_category")
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
        .item(
            &MenuItemBuilder::new("Search Documents")
                .id("search")
                .accelerator("CmdOrCtrl+F")
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
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&help_menu)
        .build()?;

    Ok(menu)
}

pub fn handle_menu_event(app: &AppHandle<Wry>, event: &str) {
    match event {
        "new_document" => {
            app.emit("menu_new_document", ()).unwrap();
        }
        "new_category" => {
            app.emit("menu_new_category", ()).unwrap();
        }
        "settings" => {
            app.emit("menu_settings", ()).unwrap();
        }
        "quit" => {
            app.exit(0);
        }
        "toggle_sidebar" => {
            app.emit("menu_toggle_sidebar", ()).unwrap();
        }
        "search" => {
            app.emit("menu_search", ()).unwrap();
        }
        "reload" => {
            app.emit("menu_reload", ()).unwrap();
        }
        "about" => {
            app.emit("menu_about", ()).unwrap();
        }
        _ => {}
    }
}
