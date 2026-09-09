-- Adiciona o campo "Cargo" às questões, usado como mais um filtro
-- no Banco de Questões e no gerador de Cadernos de Questões
-- (ao lado de banca, nível e ano, que já existem).

ALTER TABLE questions ADD COLUMN IF NOT EXISTS cargo TEXT;
