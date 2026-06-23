-- ============================================================
-- DESABILITA RLS PARA DESENVOLVIMENTO (login mockado)
-- Execute APÓS o migration.sql se estiver usando login mockado
-- ============================================================

-- Desabilita RLS em todas as tabelas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE simulado_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_simulados DISABLE ROW LEVEL SECURITY;

-- Garante que o bucket education-files existe
INSERT INTO storage.buckets (id, name, public) VALUES ('education-files', 'education-files', true)
ON CONFLICT (id) DO NOTHING;

-- Remove policies antigas de storage se existirem
DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_own" ON storage.objects;

-- Permite acesso público ao storage (dev)
DROP POLICY IF EXISTS "storage_public_all" ON storage.objects;
CREATE POLICY "storage_public_all" ON storage.objects FOR ALL USING (bucket_id = 'education-files') WITH CHECK (bucket_id = 'education-files');
