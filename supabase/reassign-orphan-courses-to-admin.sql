-- ============================================================
-- Reatribui os cursos/módulos órfãos (teacher_id = '3', professor
-- mockado) para o admin real, opção B da revisão de RLS de
-- courses/modules/lessons.
--
-- Rode manualmente no SQL Editor, depois de conferir os SELECTs.
-- Não depende de enable-rls-production.sql / enable-rls-content.sql
-- terem sido aplicados antes (é um UPDATE simples de dado).
-- ============================================================

-- Conferir antes: deve listar os mesmos 5 cursos e 2 módulos já
-- levantados (todos com teacher_id = '3').
SELECT id, title, teacher_id FROM courses WHERE teacher_id = '3';
SELECT id, course_id, teacher_id FROM modules WHERE teacher_id = '3';

-- Reatribuição
UPDATE courses
SET teacher_id = 'eabb407c-8e1a-4a5c-a7e2-255f0294bcac'
WHERE teacher_id = '3';

UPDATE modules
SET teacher_id = 'eabb407c-8e1a-4a5c-a7e2-255f0294bcac'
WHERE teacher_id = '3';

-- Conferir depois: deve retornar 0 linhas em ambos.
SELECT id, title, teacher_id FROM courses WHERE teacher_id = '3';
SELECT id, course_id, teacher_id FROM modules WHERE teacher_id = '3';
