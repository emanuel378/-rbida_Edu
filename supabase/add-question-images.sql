-- Adiciona colunas para imagens no enunciado e alternativas
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS question_image_url TEXT,
  ADD COLUMN IF NOT EXISTS option_images JSONB DEFAULT '[]';
