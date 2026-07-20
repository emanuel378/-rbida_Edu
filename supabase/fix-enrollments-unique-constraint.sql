-- ============================================================
-- Corrige a ausência da constraint UNIQUE(user_id, course_id) em
-- enrollments no banco em produção (o migration.sql já previa isso,
-- mas o banco atual não tem — confirmado pelo erro Postgres 42P10
-- ao rodar upsert com onConflict a partir do asaas-webhook).
-- Seguro rodar mesmo que já existam matrículas: só falha se houver
-- duplicatas reais de (user_id, course_id), o que não é esperado.
-- ============================================================

DO $$
BEGIN
  ALTER TABLE enrollments ADD CONSTRAINT enrollments_user_course_unique UNIQUE (user_id, course_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;
