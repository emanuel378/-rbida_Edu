-- Deixa de guardar qual alternativa o aluno marcou em question_answers;
-- guarda apenas se ele acertou ou errou (um registro por aluno/questão).
ALTER TABLE question_answers DROP COLUMN IF EXISTS selected_answer;
ALTER TABLE question_answers ADD CONSTRAINT question_answers_question_user_unique UNIQUE (question_id, user_id);
