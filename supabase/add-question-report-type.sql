-- ============================================================
-- Adiciona 'question_report' ao tipo de mensagem permitido.
-- Necessário para o botão "Notificar Erro" no Banco de Questões.
-- Execute no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;

ALTER TABLE messages ADD CONSTRAINT messages_type_check
  CHECK (type IN ('question', 'price_request', 'delete_request', 'publish_request', 'question_report'));
