-- ============================================================
-- Preço promocional fixo no cartão, por curso — complementa add-card-fee-column.sql
-- Quando preenchidos, esses valores substituem o cálculo automático de
-- repasse de taxa da Asaas só para o curso em questão (os demais cursos
-- continuam usando o cálculo automático normalmente).
-- Execute depois do add-card-fee-column.sql
-- ============================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS card_cash_price DECIMAL(10,2);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS card_3x_price DECIMAL(10,2);

-- Preço específico do curso BANCO DE QUESTÕES:
-- Pix e cartão à vista: R$ 49,90 (sem repasse de taxa no à vista)
-- Cartão 3x: R$ 19,90 x 3 = R$ 59,70 no total (preço promocional fixo, não é o cálculo automático)
UPDATE courses
SET price = 49.90,
    card_cash_price = 49.90,
    card_3x_price = 59.70
WHERE title = 'BANCO DE QUESTÕES';
