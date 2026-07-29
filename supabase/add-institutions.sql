-- ============================================================
-- Cria a tabela de instituições, cadastradas pelo admin, e liga
-- as questões a uma instituição (ex: escola/orgão da banca).
-- Aparece como campo de seleção no cadastro de questões e como
-- filtro no Banco de Questões (admin/professor/aluno).
--
-- RLS: assim como courses/modules/lessons/questions hoje (ver
-- supabase/disable-rls-dev.sql), esta tabela fica sem RLS por
-- enquanto — a gestão de conteúdo ainda roda sobre o login
-- mockado, sem JWT real do Supabase Auth. A tela de cadastro em
-- si já é restrita a admin via ProtectedRoute (roles=['admin']),
-- igual às outras telas do painel admin. Quando o RLS de conteúdo
-- for reativado (ver supabase/enable-rls-content.sql), aplicar o
-- mesmo padrão aqui: SELECT público, INSERT/UPDATE/DELETE só com
-- is_admin().
-- ============================================================

CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS institution_id TEXT;
