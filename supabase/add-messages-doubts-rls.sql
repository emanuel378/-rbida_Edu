-- ============================================================
-- Tira-dúvidas aluno <-> professor: coluna nova + RLS na tabela
-- `messages`. Essa tabela já existia (dúvidas de aula/módulo/curso e
-- pedidos de preço/publicação/exclusão professor->admin), mas nunca
-- teve RLS reativado depois do disable-rls-dev.sql — hoje qualquer
-- usuário (ou anônimo) lê/escreve/edita qualquer linha.
--
-- Pré-requisito: rode depois de enable-rls-production.sql (usa
-- is_admin() e owns_course(), criados lá).
-- ============================================================

-- ------------------------------------------------------------
-- Link direto pra questão do banco de questões (dúvida sobre uma
-- questão específica). course_id/module_id/lesson_id já existiam.
-- ------------------------------------------------------------
ALTER TABLE messages ADD COLUMN IF NOT EXISTS question_id TEXT;
CREATE INDEX IF NOT EXISTS idx_messages_question ON messages(question_id);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_own_or_staff" ON messages;
DROP POLICY IF EXISTS "messages_insert_self" ON messages;
DROP POLICY IF EXISTS "messages_update_staff_or_admin" ON messages;

-- Aluno vê as próprias mensagens (dúvidas enviadas por ele); professor
-- vê as mensagens dos cursos que é dono (dúvidas de aluno + os próprios
-- pedidos de preço/publicação/exclusão que ele mandou pro admin);
-- admin vê tudo.
CREATE POLICY "messages_select_own_or_staff" ON messages
  FOR SELECT
  USING (
    auth.uid()::text = from_user_id
    OR is_admin()
    OR owns_course(course_id)
  );

-- Cada usuário só insere mensagem em nome de si mesmo (from_user_id).
-- Dúvidas (question) e relatos de erro de questão (question_report)
-- qualquer aluno pode mandar; pedidos administrativos
-- (price/publish/delete_request) só o professor dono do curso ou o
-- próprio admin (o admin também insere um publish_request "auto-aprovado"
-- ao publicar direto pela tela dele — ver Admin.tsx).
CREATE POLICY "messages_insert_self" ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = from_user_id
    AND (
      type IN ('question', 'question_report')
      OR (type IN ('price_request', 'publish_request', 'delete_request') AND (owns_course(course_id) OR is_admin()))
    )
  );

-- Resposta do professor (reply) ou resolução do admin (status/resolved_at)
-- só por quem é dono do curso ou admin.
CREATE POLICY "messages_update_staff_or_admin" ON messages
  FOR UPDATE
  USING (owns_course(course_id) OR is_admin())
  WITH CHECK (owns_course(course_id) OR is_admin());
