-- ============================================================
-- Parcelamento no cartão configurável por curso (pelo admin)
-- Complementa add-course-card-pricing.sql — execute depois dele.
--
-- card_max_installments: número máximo de parcelas oferecidas (1 a 12).
--   NULL = comportamento antigo (só à vista ou 3x).
-- card_interest_free_installments: até quantas parcelas o aluno paga sem juros
--   (só o repasse da taxa da Asaas). Acima disso aplica card_interest_rate.
-- card_interest_rate: juros ao mês em % (ex.: 1.99), calculado pela Tabela Price.
-- ============================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS card_max_installments INTEGER
  CHECK (card_max_installments IS NULL OR card_max_installments BETWEEN 1 AND 12);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS card_interest_free_installments INTEGER
  CHECK (card_interest_free_installments IS NULL OR card_interest_free_installments BETWEEN 1 AND 12);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS card_interest_rate DECIMAL(5,2)
  CHECK (card_interest_rate IS NULL OR card_interest_rate BETWEEN 0 AND 20);
