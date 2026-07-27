-- ============================================================
-- Adiciona a capa (imagem de divulgacao) do curso, exibida nos
-- cards de curso (vitrine/dashboard do aluno), na lista de cursos
-- do professor e na tela de checkout.
-- ============================================================

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
