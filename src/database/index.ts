import { appDataDir, join } from "@tauri-apps/api/path";
import { exists, remove } from "@tauri-apps/plugin-fs";
import Database from "@tauri-apps/plugin-sql";

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  parent_id: number | null;
  description: string | null;
  level: number;
  sort_order: number;
  created_at: string;
}

export interface CategoryWithChildren extends Category {
  subcategories?: Category[];
  documentCount?: number;
  totalDocumentCount?: number; // Includes subcategories
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

    // Categories with subcategory support
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT DEFAULT 'folder',
        color TEXT DEFAULT '#6B7280',
        parent_id INTEGER DEFAULT NULL,
        description TEXT DEFAULT NULL,
        level INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE CASCADE
      )
    `);

    // Documents (unchanged)
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

    // Attachments (unchanged)
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
      // Insert root categories
      await this.db.execute(`
        INSERT INTO categories (name, icon, color, parent_id, description, level, sort_order) VALUES 
        ('Receitas', 'utensils', '#EA580C', NULL, 'Todas as suas receitas culinárias organizadas', 0, 1),
        ('Construção', 'hammer', '#2563EB', NULL, 'Projetos e documentação de construção', 0, 2),
        ('Arquitetura', 'drafting-compass', '#059669', NULL, 'Projetos arquitetônicos e design', 0, 3),
        ('Educação', 'graduation-cap', '#7C3AED', NULL, 'Materiais educacionais e aprendizado', 0, 4)
      `);

      // Get the inserted root category IDs
      const rootCategories = (await this.db.select(
        "SELECT id, name FROM categories WHERE parent_id IS NULL ORDER BY sort_order"
      )) as Array<{ id: number; name: string }>;

      // Insert subcategories for each root category
      for (const rootCat of rootCategories) {
        switch (rootCat.name) {
          case "Receitas":
            await this.db.execute(
              `
              INSERT INTO categories (name, icon, color, parent_id, description, level, sort_order) VALUES 
              ('Doces', 'cookie', '#F59E0B', ?, 'Sobremesas, bolos, tortas e doces em geral', 1, 1),
              ('Salgados', 'pizza', '#EF4444', ?, 'Pratos principais, aperitivos e lanches', 1, 2),
              ('Bebidas', 'coffee', '#8B5CF6', ?, 'Sucos, drinks, cafés e chás especiais', 1, 3),
              ('Massas', 'bread', '#10B981', ?, 'Massas caseiras, pães e fermentados', 1, 4)
            `,
              [rootCat.id, rootCat.id, rootCat.id, rootCat.id]
            );
            break;

          case "Construção":
            await this.db.execute(
              `
              INSERT INTO categories (name, icon, color, parent_id, description, level, sort_order) VALUES 
              ('Elétrica', 'bolt', '#10B981', ?, 'Instalações e projetos elétricos', 1, 1),
              ('Hidráulica', 'wrench', '#3B82F6', ?, 'Encanamento e sistemas hidráulicos', 1, 2),
              ('Estrutural', 'building', '#F59E0B', ?, 'Fundações, vigas e estruturas', 1, 3),
              ('Acabamento', 'paint-brush', '#EF4444', ?, 'Pintura, revestimentos e detalhes', 1, 4)
            `,
              [rootCat.id, rootCat.id, rootCat.id, rootCat.id]
            );
            break;

          case "Arquitetura":
            await this.db.execute(
              `
              INSERT INTO categories (name, icon, color, parent_id, description, level, sort_order) VALUES 
              ('Residencial', 'house', '#3B82F6', ?, 'Projetos para casas e apartamentos', 1, 1),
              ('Comercial', 'briefcase', '#F59E0B', ?, 'Escritórios, lojas e estabelecimentos', 1, 2),
              ('Paisagismo', 'tree', '#10B981', ?, 'Jardins, parques e áreas verdes', 1, 3)
            `,
              [rootCat.id, rootCat.id, rootCat.id]
            );
            break;

          case "Educação":
            await this.db.execute(
              `
              INSERT INTO categories (name, icon, color, parent_id, description, level, sort_order) VALUES 
              ('Cursos', 'book', '#3B82F6', ?, 'Material de cursos e treinamentos', 1, 1),
              ('Certificações', 'certificate', '#F59E0B', ?, 'Documentos de certificação e diplomas', 1, 2),
              ('Pesquisa', 'search', '#10B981', ?, 'Artigos, papers e material de pesquisa', 1, 3)
            `,
              [rootCat.id, rootCat.id, rootCat.id]
            );
            break;
        }
      }
    }
  }

  // === CATEGORIES WITH SUBCATEGORY SUPPORT ===

  // Get all root categories with their subcategories
  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select(
      "SELECT * FROM categories ORDER BY level ASC, sort_order ASC, name ASC"
    );
  }

  // Get root categories only
  async getRootCategories(): Promise<Category[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select(
      "SELECT * FROM categories WHERE parent_id IS NULL ORDER BY sort_order ASC, name ASC"
    );
  }

  // Get subcategories for a parent category
  async getSubcategories(parentId: number): Promise<Category[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select(
      "SELECT * FROM categories WHERE parent_id = ? ORDER BY sort_order ASC, name ASC",
      [parentId]
    );
  }

  // Get category hierarchy (root with subcategories)
  async getCategoriesWithSubcategories(): Promise<CategoryWithChildren[]> {
    if (!this.db) throw new Error("Database not initialized");

    const rootCategories = await this.getRootCategories();
    const result: CategoryWithChildren[] = [];

    for (const rootCat of rootCategories) {
      const subcategories = await this.getSubcategories(rootCat.id);
      const categoryWithChildren: CategoryWithChildren = {
        ...rootCat,
        subcategories,
        documentCount: 0,
        totalDocumentCount: 0,
      };

      // Calculate document counts
      const directDocuments = (await this.db.select(
        "SELECT COUNT(*) as count FROM documents WHERE category_id = ?",
        [rootCat.id]
      )) as { count: number }[];
      categoryWithChildren.documentCount = directDocuments[0].count;

      // Calculate total document count (including subcategories)
      let totalCount = categoryWithChildren.documentCount;
      for (const subcat of subcategories) {
        const subcatDocuments = (await this.db.select(
          "SELECT COUNT(*) as count FROM documents WHERE category_id = ?",
          [subcat.id]
        )) as { count: number }[];
        totalCount += subcatDocuments[0].count;
      }
      categoryWithChildren.totalDocumentCount = totalCount;

      result.push(categoryWithChildren);
    }

    return result;
  }

  // Get category by ID with parent information
  async getCategoryById(id: number): Promise<Category | null> {
    if (!this.db) throw new Error("Database not initialized");
    const categories = (await this.db.select(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    )) as Category[];
    return categories.length > 0 ? categories[0] : null;
  }

  // Get full category path (for breadcrumbs)
  async getCategoryPath(categoryId: number): Promise<Category[]> {
    if (!this.db) throw new Error("Database not initialized");

    const path: Category[] = [];
    let currentId: number | null = categoryId;

    while (currentId !== null) {
      const category = await this.getCategoryById(currentId);
      if (category) {
        path.unshift(category); // Add to beginning
        currentId = category.parent_id;
      } else {
        break;
      }
    }

    return path;
  }

  // Create category (can be root or subcategory)
  async createCategory(
    name: string,
    icon: string = "folder",
    color: string = "#6B7280",
    parentId: number | null = null,
    description: string | null = null
  ): Promise<Category> {
    if (!this.db) throw new Error("Database not initialized");

    const level = parentId ? 1 : 0; // Simple level calculation

    // Get next sort order for the level
    const sortOrderResult = (await this.db.select(
      parentId
        ? "SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM categories WHERE parent_id = ?"
        : "SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM categories WHERE parent_id IS NULL",
      parentId ? [parentId] : []
    )) as { next_order: number }[];

    const result = await this.db.execute(
      "INSERT INTO categories (name, icon, color, parent_id, description, level, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        icon,
        color,
        parentId,
        description,
        level,
        sortOrderResult[0].next_order,
      ]
    );

    const categories = (await this.db.select(
      "SELECT * FROM categories WHERE id = ?",
      [result.lastInsertId]
    )) as Category[];
    return categories[0];
  }

  // Update category
  async updateCategory(
    id: number,
    name: string,
    icon: string,
    color: string,
    description?: string | null
  ): Promise<Category> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execute(
      "UPDATE categories SET name = ?, icon = ?, color = ?, description = ? WHERE id = ?",
      [name, icon, color, description || null, id]
    );

    const categories = (await this.db.select(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    )) as Category[];
    return categories[0];
  }

  // Delete category (handles subcategories)
  async deleteCategory(id: number, targetCategoryId?: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // Get subcategories
    const subcategories = await this.getSubcategories(id);

    // Check if there are documents in this category or subcategories
    const documents = await this.getDocumentsByCategory(id);
    const allDocuments = [...documents];

    for (const subcat of subcategories) {
      const subcatDocs = await this.getDocumentsByCategory(subcat.id);
      allDocuments.push(...subcatDocs);
    }

    if (allDocuments.length > 0) {
      if (targetCategoryId) {
        // Move all documents to target category
        for (const doc of allDocuments) {
          await this.db.execute(
            "UPDATE documents SET category_id = ? WHERE id = ?",
            [targetCategoryId, doc.id]
          );
        }
      } else {
        // Delete all documents (this will cascade delete attachments)
        for (const doc of allDocuments) {
          await this.deleteDocument(doc.id);
        }
      }
    }

    // Delete the category (CASCADE will delete subcategories)
    await this.db.execute("DELETE FROM categories WHERE id = ?", [id]);
  }

  // === DOCUMENTS (mostly unchanged, but with subcategory awareness) ===

  async getDocumentsByCategory(categoryId: number): Promise<Document[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select(
      "SELECT * FROM documents WHERE category_id = ? ORDER BY updated_at DESC",
      [categoryId]
    );
  }

  // Get documents by category including subcategories
  async getDocumentsByCategoryTree(
    rootCategoryId: number
  ): Promise<Document[]> {
    if (!this.db) throw new Error("Database not initialized");

    // Get documents from root category
    const rootDocs = await this.getDocumentsByCategory(rootCategoryId);

    // Get documents from all subcategories
    const subcategories = await this.getSubcategories(rootCategoryId);
    const allDocs = [...rootDocs];

    for (const subcat of subcategories) {
      const subcatDocs = await this.getDocumentsByCategory(subcat.id);
      allDocs.push(...subcatDocs);
    }

    // Sort by updated_at desc
    return allDocs.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  // Rest of the methods remain the same...
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

    const attachments = await this.getAttachments(id);

    // Delete physical attachment files first
    const fileDeletePromises = attachments.map(async (attachment) => {
      try {
        const fileExists = await exists(attachment.filepath);
        if (fileExists) {
          await remove(attachment.filepath);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return `Failed to delete file ${attachment.filepath}: ${errorMessage}`;
      }
      return null;
    });

    const fileResults = await Promise.all(fileDeletePromises);
    const fileErrors = fileResults.filter(
      (result): result is string => result !== null
    );

    // Try to remove document directory
    let directoryError: string | null = null;
    try {
      const appDir = await appDataDir();
      const attachmentsDir = await join(
        appDir,
        "ando-archive",
        "attachments",
        id.toString()
      );
      const dirExists = await exists(attachmentsDir);
      if (dirExists) {
        await remove(attachmentsDir, { recursive: true });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      directoryError = `Could not remove directory: ${errorMessage}`;
    }

    // Delete from database
    await this.db.execute("DELETE FROM documents WHERE id = ?", [id]);

    const allWarnings = [...fileErrors];
    if (directoryError) {
      allWarnings.push(directoryError);
    }

    if (allWarnings.length > 0) {
      const warningMessage = `Document deleted successfully, but with warnings: ${allWarnings.join(
        "; "
      )}`;
      console.warn(warningMessage);
    }
  }

  async deleteAttachment(attachmentId: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const attachments = (await this.db.select(
      "SELECT * FROM attachments WHERE id = ?",
      [attachmentId]
    )) as Attachment[];

    if (attachments.length === 0) {
      throw new Error("Attachment not found");
    }

    const attachment = attachments[0];

    try {
      const normalizedPath = attachment.filepath.replace(/\//g, "\\");
      const fileExists = await exists(normalizedPath);
      if (fileExists) {
        await remove(normalizedPath);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.warn(`Could not delete attachment file: ${errorMessage}`);
    }

    await this.db.execute("DELETE FROM attachments WHERE id = ?", [
      attachmentId,
    ]);
  }

  async searchDocuments(query: string): Promise<Document[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select(
      `SELECT * FROM documents 
       WHERE title LIKE ? OR description LIKE ? OR text_content LIKE ?
       ORDER BY updated_at DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
  }

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

  async getCategoryByName(name: string): Promise<Category | null> {
    if (!this.db) throw new Error("Database not initialized");
    const categories = (await this.db.select(
      "SELECT * FROM categories WHERE LOWER(name) = LOWER(?)",
      [name]
    )) as Category[];
    return categories.length > 0 ? categories[0] : null;
  }

  async getCategoryDocumentCount(categoryId: number): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");
    const result = (await this.db.select(
      "SELECT COUNT(*) as count FROM documents WHERE category_id = ?",
      [categoryId]
    )) as { count: number }[];
    return result[0].count;
  }

  async getAllCategoryDocumentCounts(): Promise<{ [key: number]: number }> {
    if (!this.db) throw new Error("Database not initialized");
    const results = (await this.db.select(`
      SELECT category_id, COUNT(*) as count 
      FROM documents 
      GROUP BY category_id
    `)) as { category_id: number; count: number }[];

    const counts: { [key: number]: number } = {};
    results.forEach((result) => {
      counts[result.category_id] = result.count;
    });

    return counts;
  }
}

export const db = new DatabaseManager();
