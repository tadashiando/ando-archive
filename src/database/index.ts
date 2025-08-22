import Database from "@tauri-apps/plugin-sql";

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
  private db: Database | null = null;

  async init() {
    this.db = await Database.load("sqlite:ando-archive.db");
    await this.createTables();
    await this.insertDefaultCategories();
  }

  private async createTables() {
    if (!this.db) throw new Error("Database not initialized");

    // Categorias
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT DEFAULT 'folder',
        color TEXT DEFAULT '#6B7280',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Documentos
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        text_content TEXT,
        category_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
      )
    `);

    // Anexos
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        filetype TEXT NOT NULL,
        filesize INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
      )
    `);
  }

  private async insertDefaultCategories() {
    if (!this.db) return;

    const categories = (await this.db.select(
      "SELECT COUNT(*) as count FROM categories"
    )) as { count: number }[];
    if (categories[0].count === 0) {
      await this.db.execute(`
        INSERT INTO categories (name, icon, color) VALUES 
        ('Receitas', 'utensils', '#EA580C'),
        ('Construção', 'hammer', '#2563EB'),
        ('Arquitetura', 'drafting-compass', '#059669'),
        ('Educação', 'graduation-cap', '#7C3AED')
      `);
    }
  }

  // === CATEGORIAS ===
  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select("SELECT * FROM categories ORDER BY name");
  }

  async createCategory(
    name: string,
    icon: string = "folder",
    color: string = "#6B7280"
  ): Promise<Category> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.execute(
      "INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)",
      [name, icon, color]
    );

    const categories = (await this.db.select(
      "SELECT * FROM categories WHERE id = ?",
      [result.lastInsertId]
    )) as Category[];
    return categories[0];
  }

  // === DOCUMENTOS ===
  async getDocumentsByCategory(categoryId: number): Promise<Document[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select(
      "SELECT * FROM documents WHERE category_id = ? ORDER BY updated_at DESC",
      [categoryId]
    );
  }

  async createDocument(
    title: string,
    description: string,
    textContent: string,
    categoryId: number
  ): Promise<Document> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.execute(
      "INSERT INTO documents (title, description, text_content, category_id) VALUES (?, ?, ?, ?)",
      [title, description, textContent, categoryId]
    );

    const documents = (await this.db.select(
      "SELECT * FROM documents WHERE id = ?",
      [result.lastInsertId]
    )) as Document[];
    return documents[0];
  }

  async updateDocument(
    id: number,
    title: string,
    description: string,
    textContent: string
  ): Promise<Document> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execute(
      "UPDATE documents SET title = ?, description = ?, text_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [title, description, textContent, id]
    );

    const documents = (await this.db.select(
      "SELECT * FROM documents WHERE id = ?",
      [id]
    )) as Document[];
    return documents[0];
  }

  // Adicionar no DatabaseManager
  async getDocumentById(id: number): Promise<Document | null> {
    if (!this.db) throw new Error("Database not initialized");
    const documents = (await this.db.select(
      "SELECT * FROM documents WHERE id = ?",
      [id]
    )) as Document[];
    return documents.length > 0 ? documents[0] : null;
  }

  async deleteDocument(id: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.execute("DELETE FROM documents WHERE id = ?", [id]);
  }
  // === BUSCA ===
  async searchDocuments(query: string): Promise<Document[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select(
      `SELECT * FROM documents 
       WHERE title LIKE ? OR description LIKE ? OR text_content LIKE ?
       ORDER BY updated_at DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
  }

  // === ANEXOS ===
  async getAttachments(documentId: number): Promise<Attachment[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select(
      "SELECT * FROM attachments WHERE document_id = ?",
      [documentId]
    );
  }

  async addAttachment(
    documentId: number,
    filename: string,
    filepath: string,
    filetype: string,
    filesize: number
  ): Promise<Attachment> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.execute(
      "INSERT INTO attachments (document_id, filename, filepath, filetype, filesize) VALUES (?, ?, ?, ?, ?)",
      [documentId, filename, filepath, filetype, filesize]
    );

    const attachments = (await this.db.select(
      "SELECT * FROM attachments WHERE id = ?",
      [result.lastInsertId]
    )) as Attachment[];
    return attachments[0];
  }
}

export const db = new DatabaseManager();
