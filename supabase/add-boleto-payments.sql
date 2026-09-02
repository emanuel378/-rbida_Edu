-- ============================================================
-- Pagamento via Boleto (Asaas) — complementa add-credit-card-payments.sql
-- Execute depois do add-credit-card-payments.sql e do add-card-fee-column.sql
-- ============================================================

-- Libera 'boleto' como forma de pagamento (o CHECK inline de
-- add-credit-card-payments.sql chama-se orders_payment_method_check).
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('pix', 'credit_card', 'boleto'));

-- Só preenchidos quando payment_method = 'boleto'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS boleto_url TEXT;       -- PDF/página do boleto (bankSlipUrl do Asaas)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS boleto_line TEXT;      -- linha digitável (identificationField do Asaas)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS boleto_due_date DATE;  -- vencimento do boleto

-- gross_amount (criado em add-card-fee-column.sql) também vale para boleto:
--   amount       = preço líquido do curso (o que a plataforma recebe)
--   gross_amount = amount + taxa de emissão do boleto repassada ao aluno
