-- ============================================================
-- Adiciona campos de telefone e foto de perfil (avatar) na
-- tabela profiles, usados na tela de Perfil/Configurações.
-- O avatar é enviado para o bucket público "education-files",
-- já usado para PDFs e imagens de questões.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
