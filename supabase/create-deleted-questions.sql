-- ============================================================
-- Criação da tabela de questões deletadas
-- Copie e execute este SQL no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS deleted_questions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  module_id TEXT,
  topic_id TEXT,
  assunto TEXT,
  banca TEXT,
  nivel TEXT,
  ano TEXT,
  gabarito_comentado TEXT,
  material_url TEXT,
  material_type TEXT CHECK (material_type IN ('image', 'pdf')),
  aulas_relacionadas JSONB DEFAULT '[]',
  deleted_at TIMESTAMPTZ DEFAULT now(),
  deleted_by TEXT DEFAULT 'admin'
);

-- Índice para buscas por data de exclusão
CREATE INDEX IF NOT EXISTS idx_deleted_questions_deleted_at ON deleted_questions(deleted_at);
