-- Cadernos de Questões: conjuntos de questões gerados pelo aluno a partir de
-- filtros (banco de questões), salvos na conta do usuário com um id próprio,
-- e o progresso de resolução de cada caderno.

CREATE TABLE IF NOT EXISTS question_notebooks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  question_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_question_notebooks_user ON question_notebooks(user_id);

CREATE TABLE IF NOT EXISTS notebook_attempts (
  id TEXT PRIMARY KEY,
  notebook_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  answers JSONB DEFAULT '{}',
  current_index INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_notebook_attempts_notebook ON notebook_attempts(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notebook_attempts_user ON notebook_attempts(user_id);

-- NOTA: RLS desabilitado por enquanto porque o app usa login mockado, não
-- Supabase Auth (mesmo padrão de create-deleted-questions.sql / add-institutions.sql).
-- Reativar com políticas baseadas em auth.uid() quando o login real for adotado.
ALTER TABLE question_notebooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE notebook_attempts DISABLE ROW LEVEL SECURITY;
