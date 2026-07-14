-- Adiciona suporte a vídeos hospedados no Bunny Stream nas aulas
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS video_provider TEXT DEFAULT 'youtube',
  ADD COLUMN IF NOT EXISTS bunny_video_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'ready';
