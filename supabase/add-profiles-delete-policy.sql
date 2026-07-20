-- ============================================================
-- Adiciona policy de DELETE em profiles, restrita a admin.
-- Depende de is_admin() já existir (criada em enable-rls-production.sql).
-- Necessária pro botão "Rejeitar" professor pendente no Painel do Admin,
-- que apaga a linha de profiles (a conta do Supabase Auth em si
-- continua existindo, só não tem mais profile pra logar no app).
-- ============================================================

DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE
  USING (is_admin());
