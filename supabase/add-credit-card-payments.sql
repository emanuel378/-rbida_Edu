-- ============================================================
-- Pagamentos via Cartão de Crédito (Asaas) — complementa add-orders-payments.sql
-- Execute depois do add-orders-payments.sql
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'pix'
  CHECK (payment_method IN ('pix', 'credit_card'));

-- Só preenchidos quando payment_method = 'credit_card'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS installment_count INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS card_brand TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS card_last_digits TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
