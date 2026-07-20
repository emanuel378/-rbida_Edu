-- ============================================================
-- Pagamentos via Pix (Asaas) — pedidos e liberação de acesso a cursos
-- Execute depois do migration.sql (e do disable-rls-dev.sql, se aplicável)
-- ============================================================

-- CPF do aluno, exigido pelo Asaas para criar o cliente/cobrança
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf TEXT;

-- PEDIDOS (cobranças Pix geradas no Asaas)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'failed', 'refunded')),
  asaas_customer_id TEXT,
  asaas_payment_id TEXT UNIQUE,
  pix_qr_code TEXT,
  pix_payload TEXT,
  pix_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_course ON orders(course_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_asaas_payment ON orders(asaas_payment_id);

-- Realtime: o CheckoutModal escuta UPDATE nesta tabela para saber quando o Pix foi pago
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- NOTA: assim como o restante do projeto (ver disable-rls-dev.sql), o login é
-- mockado e não gera sessão real do Supabase Auth, então políticas de RLS
-- baseadas em auth.uid() não funcionam aqui. Se você estiver em modo dev com
-- RLS desligado, rode também: ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
-- (já incluído em disable-rls-dev.sql). Quando o login real for implementado,
-- troque por políticas com auth.uid() = user_id.
