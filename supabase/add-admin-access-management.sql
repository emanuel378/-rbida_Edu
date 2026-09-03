-- ============================================================
-- Painel do Admin: controle de acessos e pagamentos
-- Complementa add-orders-payments.sql / add-credit-card-payments.sql /
-- add-boleto-payments.sql / add-course-access-expiration.sql
-- Idempotente — seguro rodar mais de uma vez.
-- ============================================================

-- ------------------------------------------------------------
-- ENROLLMENTS: bloqueio pelo admin sem perder progresso + origem da matrícula
-- ------------------------------------------------------------
-- revoked_at preenchido = acesso bloqueado pelo admin. A linha continua
-- existindo (progress / completed_lessons preservados) para que o admin
-- possa reativar depois. O frontend (getEnrollment) passa a ignorar
-- matrículas com revoked_at.
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- Como a matrícula foi criada:
--   'payment'     -> via pagamento confirmado (Pix/cartão/boleto)
--   'admin_grant' -> liberada manualmente pelo admin
--   'free'        -> curso gratuito, matrícula direta pelo aluno
--   NULL          -> legado (antes desta migration)
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS source TEXT;

-- profiles.id do admin que liberou/bloqueou por último (auditoria rápida na linha)
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS granted_by TEXT;

-- Nota livre do admin (motivo da liberação/bloqueio)
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Garante a constraint usada pelo upsert (onConflict: user_id,course_id).
-- Mesmo bloco de fix-enrollments-unique-constraint.sql — repetido aqui porque
-- aquele arquivo pode não ter sido aplicado neste banco.
DO $$
BEGIN
  ALTER TABLE enrollments ADD CONSTRAINT enrollments_user_course_unique UNIQUE (user_id, course_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------
-- ADMIN_AUDIT_LOG: trilha de TODA ação feita no painel de acessos/pagamentos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id               TEXT PRIMARY KEY,
  admin_id         TEXT NOT NULL,
  admin_name       TEXT,
  action           TEXT NOT NULL,   -- grant_access | revoke_access | restore_access | sync_order | mark_paid_manual | sync_pending
  target_user_id   TEXT,
  target_user_name TEXT,
  course_id        TEXT,
  course_title     TEXT,
  order_id         TEXT,
  detail           JSONB,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

-- Leitura/escrita só passam pela Edge Function admin-manage (service role, que
-- ignora RLS). Se um dia o RLS global for ligado, adicionar:
--   ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY admin_audit_select_admin ON admin_audit_log FOR SELECT USING (is_admin());
