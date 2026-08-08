-- ============================================================
-- Repasse da taxa do cartão de crédito ao aluno — complementa add-credit-card-payments.sql
-- Execute depois do add-credit-card-payments.sql
-- ============================================================

-- Valor efetivamente cobrado do aluno no cartão (preço do curso + taxa da Asaas repassada).
-- orders.amount continua sendo o preço líquido do curso (o que a plataforma recebe),
-- igual nos dois métodos de pagamento — só o cartão preenche gross_amount.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(10,2);
