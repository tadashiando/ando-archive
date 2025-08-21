import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface Document {
  id: number;
  title: string;
  description: string;
  text_content: string;
  category_id: number;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  document_id: number;
  filename: string;
  filepath: string;
  filetype: "image" | "pdf" | "video" | "other";
  filesize: number;
  created_at: string;
}

class DatabaseManager {
  private db: Database.Database;

  constructor() {
    // Caminho do banco na pasta userData do Electron
    const userDataPath =
      process.env.NODE_ENV === "development"
        ? "./data"
        : path.join(
            process.env.HOME || process.env.USERPROFILE || "",
            ".ando-archive"
          );

    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, "ando-archive.db");
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    // Ler e executar o schema
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    this.db.exec(schema);
  }

  // === CATEGORIAS ===
  getCategories(): Category[] {
    return this.db
      .prepare("SELECT * FROM categories ORDER BY name")
      .all() as Category[];
  }

  createCategory(
    name: string,
    icon: string = "folder",
    color: string = "#6B7280"
  ): Category {
    const result = this.db
      .prepare("INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)")
      .run(name, icon, color);
    return this.db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(result.lastInsertRowid) as Category;
  }

  // === DOCUMENTOS ===
  getDocumentsByCategory(categoryId: number): Document[] {
    return this.db
      .prepare(
        "SELECT * FROM documents WHERE category_id = ? ORDER BY updated_at DESC"
      )
      .all(categoryId) as Document[];
  }

  createDocument(
    title: string,
    description: string,
    textContent: string,
    categoryId: number
  ): Document {
    const result = this.db
      .prepare(
        `
      INSERT INTO documents (title, description, text_content, category_id) 
      VALUES (?, ?, ?, ?)
    `
      )
      .run(title, description, textContent, categoryId);

    return this.db
      .prepare("SELECT * FROM documents WHERE id = ?")
      .get(result.lastInsertRowid) as Document;
  }

  updateDocument(
    id: number,
    title: string,
    description: string,
    textContent: string
  ): Document {
    this.db
      .prepare(
        `
      UPDATE documents 
      SET title = ?, description = ?, text_content = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `
      )
      .run(title, description, textContent, id);

    return this.db
      .prepare("SELECT * FROM documents WHERE id = ?")
      .get(id) as Document;
  }

  // === BUSCA ===
  searchDocuments(query: string): Document[] {
    return this.db
      .prepare(
        `
      SELECT d.* FROM documents d
      JOIN documents_fts fts ON d.id = fts.rowid
      WHERE documents_fts MATCH ?
      ORDER BY rank
    `
      )
      .all(query) as Document[];
  }

  // === ANEXOS ===
  getAttachments(documentId: number): Attachment[] {
    return this.db
      .prepare("SELECT * FROM attachments WHERE document_id = ?")
      .all(documentId) as Attachment[];
  }

  addAttachment(
    documentId: number,
    filename: string,
    filepath: string,
    filetype: string,
    filesize: number
  ): Attachment {
    const result = this.db
      .prepare(
        `
      INSERT INTO attachments (document_id, filename, filepath, filetype, filesize) 
      VALUES (?, ?, ?, ?, ?)
    `
      )
      .run(documentId, filename, filepath, filetype, filesize);

    return this.db
      .prepare("SELECT * FROM attachments WHERE id = ?")
      .get(result.lastInsertRowid) as Attachment;
  }

  close() {
    this.db.close();
  }
}

export const db = new DatabaseManager();
