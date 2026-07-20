-- ============================================================
-- REATIVA RLS PARA PRODUÇÃO (profiles, orders, enrollments)
--
-- Escopo desta migration: apenas as tabelas ligadas a identidade e
-- pagamento. courses/modules/lessons/topics/etc. continuam com RLS
-- desligado por enquanto (ver disable-rls-dev.sql) porque a gestão de
-- conteúdo (professor/admin) ainda roda sobre o login mockado, sem JWT
-- real do Supabase Auth — travar essas tabelas agora quebraria a criação
-- de curso/módulo/aula. Revisitar quando o login real virar padrão.
--
-- Pré-requisito: rode isso só depois de ter pelo menos uma conta real
-- (Supabase Auth) testada, porque contas do login mockado (sem sessão
-- real) deixam de enxergar/editar profiles, orders e enrollments — não
-- têm auth.uid(), então caem no "default deny" do RLS.
-- ============================================================

-- ------------------------------------------------------------
-- Helpers (SECURITY DEFINER para evitar recursão de RLS ao checar role)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION owns_course(course_id_arg text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM courses WHERE id = course_id_arg AND teacher_id = auth.uid()::text
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION owns_course(text) TO anon, authenticated;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;

-- Cada usuário vê o próprio perfil; admin vê todos (necessário para a
-- tela de aprovação de professores e listagem de usuários).
CREATE POLICY "profiles_select_own_or_admin" ON profiles
  FOR SELECT
  USING (auth.uid()::text = id OR is_admin());

-- Criação do próprio perfil no cadastro (signUp). Não permite se
-- autopromover a admin nem se autoaprovar como professor.
CREATE POLICY "profiles_insert_self" ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = id
    AND role IN ('aluno', 'professor')
    AND approved = (role = 'aluno')
  );

-- Edição do próprio perfil (nome, e-mail, cpf) ou qualquer perfil por
-- admin. role/approved não podem ser alterados aqui — ver trigger abaixo.
CREATE POLICY "profiles_update_own_or_admin" ON profiles
  FOR UPDATE
  USING (auth.uid()::text = id OR is_admin())
  WITH CHECK (auth.uid()::text = id OR is_admin());

-- Trava troca de role/approved por conta própria (evita
-- auto-promoção a admin ou auto-aprovação como professor via UPDATE
-- direto). Admin (via policy acima) e o service role (Edge Functions,
-- que sempre ignoram RLS) continuam podendo alterar esses campos.
CREATE OR REPLACE FUNCTION prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.approved IS DISTINCT FROM OLD.approved THEN
    RAISE EXCEPTION 'Não é permitido alterar role/approved do próprio perfil';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_profile_privilege_escalation();

-- ------------------------------------------------------------
-- ORDERS (pedidos Pix) — só a Edge Function (service role) grava.
-- ------------------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON orders;

-- Leitura do próprio pedido (usado pelo CheckoutModal para poll/realtime
-- de status). Sem policy de INSERT/UPDATE/DELETE: só create-payment e
-- asaas-webhook (service role, que ignora RLS) escrevem em orders.
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- ------------------------------------------------------------
-- ENROLLMENTS (matrículas)
-- ------------------------------------------------------------
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollments_select_own_or_staff" ON enrollments;
DROP POLICY IF EXISTS "enrollments_insert_free_course_self" ON enrollments;
DROP POLICY IF EXISTS "enrollments_update_own_progress" ON enrollments;

-- Aluno vê as próprias matrículas; professor vê matrículas dos cursos
-- dele (necessário para as telas de analytics/gestão de curso); admin
-- vê tudo.
CREATE POLICY "enrollments_select_own_or_staff" ON enrollments
  FOR SELECT
  USING (
    auth.uid()::text = user_id
    OR is_admin()
    OR owns_course(course_id)
  );

-- Matrícula direta pelo cliente só é permitida em curso gratuito e
-- somente para si mesmo. Matrícula em curso pago só é criada pelo
-- asaas-webhook (service role) após confirmação de pagamento — por isso
-- não existe policy de INSERT cobrindo curso pago.
CREATE POLICY "enrollments_insert_free_course_self" ON enrollments
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id
    AND EXISTS (
      SELECT 1 FROM courses c WHERE c.id = course_id AND (c.price IS NULL OR c.price <= 0)
    )
  );

-- Atualização de progresso (completed_lessons) na própria matrícula.
CREATE POLICY "enrollments_update_own_progress" ON enrollments
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Trava troca de user_id/course_id via UPDATE (impediria um aluno
-- "realocar" a própria matrícula para um curso pago sem pagar).
CREATE OR REPLACE FUNCTION prevent_enrollment_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.course_id IS DISTINCT FROM OLD.course_id THEN
    RAISE EXCEPTION 'Não é permitido alterar user_id/course_id de uma matrícula existente';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_enrollment_tampering ON enrollments;
CREATE TRIGGER trg_prevent_enrollment_tampering
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION prevent_enrollment_tampering();
