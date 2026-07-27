-- ============================================================
-- Adiciona registro de aceite dos termos legais (Termo de Uso,
-- Política de Privacidade e Política de Cancelamento e Reembolso)
-- no cadastro. Guarda a data/hora em que o usuário marcou a
-- caixa de aceite no formulário de cadastro.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
