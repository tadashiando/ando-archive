-- src/database/schema.sql - Updated schema for subcategories

-- Drop existing categories table and recreate with subcategory support
DROP TABLE IF EXISTS categories;

-- Recreate categories table with subcategory support
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#6B7280',
  parent_id INTEGER DEFAULT NULL,
  description TEXT DEFAULT NULL,
  level INTEGER DEFAULT 0, -- 0=root, 1=subcategory, 2=sub-subcategory (future)
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE CASCADE
);

-- Documents table remains the same (uses category_id which can be subcategory)
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  text_content TEXT, -- HTML do TipTap
  category_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

-- Attachments table remains the same
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  filetype TEXT NOT NULL, -- 'image', 'pdf', 'video', 'other'
  filesize INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
);

-- Busca full-text (unchanged)
CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  title, 
  description, 
  text_content, 
  content='documents', 
  content_rowid='id'
);

-- Triggers for FTS (unchanged)
CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(rowid, title, description, text_content) 
  VALUES (new.id, new.title, new.description, new.text_content);
END;

CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, title, description, text_content) 
  VALUES('delete', old.id, old.title, old.description, old.text_content);
END;

CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, title, description, text_content) 
  VALUES('delete', old.id, old.title, old.description, old.text_content);
  INSERT INTO documents_fts(rowid, title, description, text_content) 
  VALUES (new.id, new.title, new.description, new.text_content);
END;

-- Insert updated default categories with subcategories
INSERT OR REPLACE INTO categories (id, name, icon, color, parent_id, description, level, sort_order) VALUES 
-- Root categories
(1, 'Receitas', 'utensils', '#EA580C', NULL, 'Todas as suas receitas culinárias organizadas', 0, 1),
(2, 'Construção', 'hammer', '#2563EB', NULL, 'Projetos e documentação de construção', 0, 2),
(3, 'Arquitetura', 'drafting-compass', '#059669', NULL, 'Projetos arquitetônicos e design', 0, 3),
(4, 'Educação', 'graduation-cap', '#7C3AED', NULL, 'Materiais educacionais e aprendizado', 0, 4),

-- Subcategories under Receitas (id=1)
(5, 'Doces', 'cookie', '#F59E0B', 1, 'Sobremesas, bolos, tortas e doces em geral', 1, 1),
(6, 'Salgados', 'pizza', '#EF4444', 1, 'Pratos principais, aperitivos e lanches', 1, 2),
(7, 'Bebidas', 'coffee', '#8B5CF6', 1, 'Sucos, drinks, cafés e chás especiais', 1, 3),
(8, 'Massas', 'bread', '#10B981', 1, 'Massas caseiras, pães e fermentados', 1, 4),

-- Subcategories under Construção (id=2)
(9, 'Elétrica', 'bolt', '#10B981', 2, 'Instalações e projetos elétricos', 1, 1),
(10, 'Hidráulica', 'wrench', '#3B82F6', 2, 'Encanamento e sistemas hidráulicos', 1, 2),
(11, 'Estrutural', 'building', '#F59E0B', 2, 'Fundações, vigas e estruturas', 1, 3),
(12, 'Acabamento', 'paint-brush', '#EF4444', 2, 'Pintura, revestimentos e detalhes', 1, 4),

-- Subcategories under Arquitetura (id=3)
(13, 'Residencial', 'house', '#3B82F6', 3, 'Projetos para casas e apartamentos', 1, 1),
(14, 'Comercial', 'briefcase', '#F59E0B', 3, 'Escritórios, lojas e estabelecimentos', 1, 2),
(15, 'Paisagismo', 'tree', '#10B981', 3, 'Jardins, parques e áreas verdes', 1, 3),

-- Subcategories under Educação (id=4)
(16, 'Cursos', 'book', '#3B82F6', 4, 'Material de cursos e treinamentos', 1, 1),
(17, 'Certificações', 'certificate', '#F59E0B', 4, 'Documentos de certificação e diplomas', 1, 2),
(18, 'Pesquisa', 'search', '#10B981', 4, 'Artigos, papers e material de pesquisa', 1, 3);