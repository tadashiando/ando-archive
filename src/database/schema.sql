-- Categorias
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#6B7280',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Documentos
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

-- Anexos (PDFs, imagens, vídeos)
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

-- Busca full-text
CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  title, 
  description, 
  text_content, 
  content='documents', 
  content_rowid='id'
);

-- Triggers para manter FTS sincronizado
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

-- Inserir categorias padrão
INSERT OR IGNORE INTO categories (id, name, icon, color) VALUES 
(1, 'Receitas', 'utensils', '#EA580C'),
(2, 'Construção', 'hammer', '#2563EB'),
(3, 'Arquitetura', 'drafting-compass', '#059669'),
(4, 'Educação', 'graduation-cap', '#7C3AED');