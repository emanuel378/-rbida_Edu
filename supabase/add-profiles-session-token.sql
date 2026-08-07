-- ============================================================
-- Impede que um aluno fique logado em dois aparelhos ao mesmo
-- tempo. A cada novo login, um token novo é gravado em
-- profiles.active_session_token, "derrubando" qualquer sessão
-- anterior — o app do outro aparelho detecta o token diferente
-- (poll periódico) e desloga sozinho.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS active_session_token TEXT;
