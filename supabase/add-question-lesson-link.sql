-- ============================================================
-- Adiciona lesson_id em questions: permite vincular uma questão
-- do banco a uma aula específica de um curso (opcional, flexível).
-- Execute no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE questions ADD COLUMN IF NOT EXISTS lesson_id TEXT;
