-- ============================================================
-- REATIVA RLS PARA courses, modules E lessons
--
-- Pré-requisito: rode supabase/enable-rls-production.sql ANTES deste
-- arquivo — ele cria is_admin() e owns_course(), reaproveitados aqui.
--
-- Leitura pública de cursos publicados/aprovados; escrita só pelo
-- professor dono do curso (auth.uid()::text = teacher_id) ou admin.
-- Assume-se autenticação real do Supabase Auth: contas do login
-- mockado (sem sessão real) não conseguem mais criar/editar conteúdo
-- depois desta migration — ver a seção "CURSOS EXISTENTES" no final,
-- os 5 cursos atuais têm teacher_id = '3' (professor mockado), não um
-- auth.uid() real.
-- ============================================================

-- ------------------------------------------------------------
-- COURSES
-- ------------------------------------------------------------
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select_public_or_owner" ON courses;
DROP POLICY IF EXISTS "courses_insert_own_pending" ON courses;
DROP POLICY IF EXISTS "courses_update_own_or_admin" ON courses;
DROP POLICY IF EXISTS "courses_delete_own_or_admin" ON courses;

-- Público vê cursos publicados e aprovados; o professor dono e o admin
-- também veem os próprios cursos ainda pendentes/não publicados.
CREATE POLICY "courses_select_public_or_owner" ON courses
  FOR SELECT
  USING (
    (published = true AND status = 'approved')
    OR auth.uid()::text = teacher_id
    OR is_admin()
  );

-- Professor só cria curso em nome dele mesmo, sempre como pending/não
-- publicado/preço zerado (é assim que a tela do professor já cria hoje
-- — preço e aprovação ficam por conta do admin). Admin pode inserir
-- com qualquer valor.
CREATE POLICY "courses_insert_own_pending" ON courses
  FOR INSERT
  WITH CHECK (
    is_admin()
    OR (
      auth.uid()::text = teacher_id
      AND status = 'pending'
      AND published = false
      AND (price IS NULL OR price = 0)
    )
  );

CREATE POLICY "courses_update_own_or_admin" ON courses
  FOR UPDATE
  USING (auth.uid()::text = teacher_id OR is_admin())
  WITH CHECK (auth.uid()::text = teacher_id OR is_admin());

CREATE POLICY "courses_delete_own_or_admin" ON courses
  FOR DELETE
  USING (auth.uid()::text = teacher_id OR is_admin());

-- Trava o professor de aprovar/publicar/precificar o próprio curso ou
-- de "passar" o curso pra outro professor via UPDATE direto — esses
-- campos continuam de uso exclusivo do fluxo de moderação do admin
-- (approveCourse/adminSetCoursePrice/adminApprovePublish). Admin e
-- service role (Edge Functions) não são afetados por esta trava.
CREATE OR REPLACE FUNCTION prevent_course_moderation_bypass()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.published IS DISTINCT FROM OLD.published
     OR NEW.price IS DISTINCT FROM OLD.price
     OR NEW.teacher_id IS DISTINCT FROM OLD.teacher_id THEN
    RAISE EXCEPTION 'Somente admin pode alterar status/published/price/teacher_id do curso';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_course_moderation_bypass ON courses;
CREATE TRIGGER trg_prevent_course_moderation_bypass
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION prevent_course_moderation_bypass();

-- ------------------------------------------------------------
-- MODULES
-- Dono é sempre o dono do curso (courses.teacher_id via owns_course),
-- não a coluna modules.teacher_id, que é só um valor herdado no
-- momento da criação e pode divergir sem nenhuma constraint garantindo
-- consistência.
-- ------------------------------------------------------------
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules_select_public_or_owner" ON modules;
DROP POLICY IF EXISTS "modules_insert_owner" ON modules;
DROP POLICY IF EXISTS "modules_update_owner" ON modules;
DROP POLICY IF EXISTS "modules_delete_owner" ON modules;

CREATE POLICY "modules_select_public_or_owner" ON modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = modules.course_id AND c.published = true AND c.status = 'approved'
    )
    OR owns_course(course_id)
    OR is_admin()
  );

CREATE POLICY "modules_insert_owner" ON modules
  FOR INSERT
  WITH CHECK (owns_course(course_id) OR is_admin());

CREATE POLICY "modules_update_owner" ON modules
  FOR UPDATE
  USING (owns_course(course_id) OR is_admin())
  WITH CHECK (owns_course(course_id) OR is_admin());

CREATE POLICY "modules_delete_owner" ON modules
  FOR DELETE
  USING (owns_course(course_id) OR is_admin());

-- ------------------------------------------------------------
-- LESSONS
-- lessons não tem course_id direto, só module_id — a checagem de dono
-- sobe até o curso via modules.
-- ------------------------------------------------------------
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons_select_public_or_owner" ON lessons;
DROP POLICY IF EXISTS "lessons_insert_owner" ON lessons;
DROP POLICY IF EXISTS "lessons_update_owner" ON lessons;
DROP POLICY IF EXISTS "lessons_delete_owner" ON lessons;

CREATE OR REPLACE FUNCTION owns_lesson_module(module_id_arg text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM modules m WHERE m.id = module_id_arg AND owns_course(m.course_id)
  );
$$;

GRANT EXECUTE ON FUNCTION owns_lesson_module(text) TO anon, authenticated;

CREATE POLICY "lessons_select_public_or_owner" ON lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = lessons.module_id AND c.published = true AND c.status = 'approved'
    )
    OR owns_lesson_module(module_id)
    OR is_admin()
  );

CREATE POLICY "lessons_insert_owner" ON lessons
  FOR INSERT
  WITH CHECK (owns_lesson_module(module_id) OR is_admin());

CREATE POLICY "lessons_update_owner" ON lessons
  FOR UPDATE
  USING (owns_lesson_module(module_id) OR is_admin())
  WITH CHECK (owns_lesson_module(module_id) OR is_admin());

CREATE POLICY "lessons_delete_owner" ON lessons
  FOR DELETE
  USING (owns_lesson_module(module_id) OR is_admin());

-- ============================================================
-- CURSOS EXISTENTES (levantamento, NADA aplicado automaticamente)
--
-- Todos os 5 cursos hoje em produção têm teacher_id = '3' (o
-- "Carlos Professor" do login mockado — não é um auth.uid() real):
--   c1                                    Preparatório IFSP
--   c2                                    Preparatório IFMG
--   b30f4f66-a3e1-49c8-ac41-8e587a9bc92b  Matematica ENEM
--   5ddecdc4-f80b-4e49-b499-9d8327d91a78  produçãoTes2
--   b9715418-739c-44dd-a8a5-b72228d8e633  enem20277
-- (todos com status='approved', published=true)
--
-- Os 2 módulos existentes também têm teacher_id = '3'. Um deles
-- (id ede8ff79-7299-481b-b8cf-b03b3810f3be) aponta pra um
-- course_id que não existe em courses (30336eb2-...) — não tem curso
-- pai, então fica invisível pra todo mundo exceto admin depois desta
-- migration. Isso é inconsistência de dado pré-existente, não algo
-- causado por esta migration.
--
-- Depois desta migration, esses cursos continuam com leitura pública
-- normal (published=true), mas SÓ o admin real consegue editá-los —
-- nenhum professor real vai bater com teacher_id='3' até você
-- reatribuir manualmente. Opções (escolha uma, não roda nada sozinho):
--
-- A) Deixar como está: só admin edita esses 5 cursos por enquanto,
--    até você decidir caso a caso depois de criar os professores reais.
--
-- B) Atribuir todos ao seu admin real agora (você vira "dono" deles
--    até reatribuir manualmente depois):
--    UPDATE courses SET teacher_id = '<uuid-do-seu-admin>' WHERE teacher_id = '3';
--    UPDATE modules SET teacher_id = '<uuid-do-seu-admin>' WHERE teacher_id = '3';
--
-- C) Atribuir curso a curso, quando for criando cada professor real:
--    UPDATE courses SET teacher_id = '<uuid-do-professor>' WHERE id = '<id-do-curso>';
--    UPDATE modules SET teacher_id = '<uuid-do-professor>' WHERE course_id = '<id-do-curso>';
-- ============================================================
