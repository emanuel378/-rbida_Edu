-- ============================================================
-- Corrige todas as colunas UUID para TEXT
-- O app usa IDs mockados como "1", "2", "3", "c1" (não UUIDs)
-- ============================================================

-- Remove todas as políticas de RLS primeiro (bloqueiam ALTER TYPE)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "courses_select_all" ON courses;
DROP POLICY IF EXISTS "courses_insert_teacher" ON courses;
DROP POLICY IF EXISTS "courses_update_teacher_admin" ON courses;
DROP POLICY IF EXISTS "courses_delete_admin" ON courses;
DROP POLICY IF EXISTS "modules_select_all" ON modules;
DROP POLICY IF EXISTS "modules_insert_teacher" ON modules;
DROP POLICY IF EXISTS "modules_update_teacher" ON modules;
DROP POLICY IF EXISTS "modules_delete_teacher" ON modules;
DROP POLICY IF EXISTS "lessons_select_all" ON lessons;
DROP POLICY IF EXISTS "lessons_insert_teacher" ON lessons;
DROP POLICY IF EXISTS "lessons_update_teacher" ON lessons;
DROP POLICY IF EXISTS "lessons_delete_teacher" ON lessons;
DROP POLICY IF EXISTS "topics_select_all" ON topics;
DROP POLICY IF EXISTS "topics_insert_teacher" ON topics;
DROP POLICY IF EXISTS "topics_update_teacher" ON topics;
DROP POLICY IF EXISTS "topics_delete_teacher" ON topics;
DROP POLICY IF EXISTS "questions_select_all" ON questions;
DROP POLICY IF EXISTS "questions_insert_teacher" ON questions;
DROP POLICY IF EXISTS "questions_update_teacher" ON questions;
DROP POLICY IF EXISTS "questions_delete_teacher" ON questions;
DROP POLICY IF EXISTS "question_stats_select_all" ON question_stats;
DROP POLICY IF EXISTS "question_stats_insert_all" ON question_stats;
DROP POLICY IF EXISTS "question_stats_update_all" ON question_stats;
DROP POLICY IF EXISTS "question_answers_select_own" ON question_answers;
DROP POLICY IF EXISTS "question_answers_insert_own" ON question_answers;
DROP POLICY IF EXISTS "enrollments_select_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_insert_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_update_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_delete_admin" ON enrollments;
DROP POLICY IF EXISTS "comments_select_all" ON comments;
DROP POLICY IF EXISTS "comments_insert_auth" ON comments;
DROP POLICY IF EXISTS "messages_select_involved" ON messages;
DROP POLICY IF EXISTS "messages_insert_auth" ON messages;
DROP POLICY IF EXISTS "messages_update_involved" ON messages;
DROP POLICY IF EXISTS "simulado_results_select_all" ON simulado_results;
DROP POLICY IF EXISTS "simulado_results_insert_own" ON simulado_results;
DROP POLICY IF EXISTS "teacher_simulados_select_own" ON teacher_simulados;
DROP POLICY IF EXISTS "teacher_simulados_insert_own" ON teacher_simulados;
DROP POLICY IF EXISTS "teacher_simulados_update_own" ON teacher_simulados;
DROP POLICY IF EXISTS "teacher_simulados_delete_own" ON teacher_simulados;

-- 1. profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- 2. courses
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_teacher_id_fkey;
ALTER TABLE courses ALTER COLUMN id TYPE TEXT;
ALTER TABLE courses ALTER COLUMN teacher_id TYPE TEXT;
DROP INDEX IF EXISTS idx_courses_teacher;

-- 3. modules
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_course_id_fkey;
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_teacher_id_fkey;
ALTER TABLE modules ALTER COLUMN id TYPE TEXT;
ALTER TABLE modules ALTER COLUMN course_id TYPE TEXT;
ALTER TABLE modules ALTER COLUMN teacher_id TYPE TEXT;
DROP INDEX IF EXISTS idx_modules_course;

-- 4. lessons
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_module_id_fkey;
ALTER TABLE lessons ALTER COLUMN id TYPE TEXT;
ALTER TABLE lessons ALTER COLUMN module_id TYPE TEXT;
DROP INDEX IF EXISTS idx_lessons_module;

-- 5. topics
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_module_id_fkey;
ALTER TABLE topics ALTER COLUMN id TYPE TEXT;
ALTER TABLE topics ALTER COLUMN module_id TYPE TEXT;
DROP INDEX IF EXISTS idx_topics_module;

-- 6. questions
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_module_id_fkey;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_topic_id_fkey;
ALTER TABLE questions ALTER COLUMN id TYPE TEXT;
-- module_id e topic_id já são TEXT (corrigido anteriormente)

-- 7. question_stats
ALTER TABLE question_stats DROP CONSTRAINT IF EXISTS question_stats_question_id_fkey;
ALTER TABLE question_stats ALTER COLUMN question_id TYPE TEXT;

-- 8. question_answers
ALTER TABLE question_answers DROP CONSTRAINT IF EXISTS question_answers_question_id_fkey;
ALTER TABLE question_answers DROP CONSTRAINT IF EXISTS question_answers_user_id_fkey;
ALTER TABLE question_answers ALTER COLUMN id TYPE TEXT;
ALTER TABLE question_answers ALTER COLUMN question_id TYPE TEXT;
ALTER TABLE question_answers ALTER COLUMN user_id TYPE TEXT;

-- 9. enrollments
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey;
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_user_id_course_id_key;
ALTER TABLE enrollments ALTER COLUMN id TYPE TEXT;
ALTER TABLE enrollments ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE enrollments ALTER COLUMN course_id TYPE TEXT;
DROP INDEX IF EXISTS idx_enrollments_user;
DROP INDEX IF EXISTS idx_enrollments_course;

-- 10. comments
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_lesson_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE comments ALTER COLUMN id TYPE TEXT;
ALTER TABLE comments ALTER COLUMN lesson_id TYPE TEXT;
ALTER TABLE comments ALTER COLUMN user_id TYPE TEXT;
DROP INDEX IF EXISTS idx_comments_lesson;

-- 11. messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_course_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_module_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_lesson_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_from_user_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_to_teacher_id_fkey;
ALTER TABLE messages ALTER COLUMN id TYPE TEXT;
ALTER TABLE messages ALTER COLUMN course_id TYPE TEXT;
ALTER TABLE messages ALTER COLUMN module_id TYPE TEXT;
ALTER TABLE messages ALTER COLUMN lesson_id TYPE TEXT;
ALTER TABLE messages ALTER COLUMN from_user_id TYPE TEXT;
ALTER TABLE messages ALTER COLUMN to_teacher_id TYPE TEXT;
DROP INDEX IF EXISTS idx_messages_course;
DROP INDEX IF EXISTS idx_messages_to_teacher;

-- 12. simulado_results
ALTER TABLE simulado_results DROP CONSTRAINT IF EXISTS simulado_results_user_id_fkey;
ALTER TABLE simulado_results ALTER COLUMN id TYPE TEXT;
ALTER TABLE simulado_results ALTER COLUMN user_id TYPE TEXT;

-- 13. teacher_simulados
ALTER TABLE teacher_simulados DROP CONSTRAINT IF EXISTS teacher_simulados_teacher_id_fkey;
ALTER TABLE teacher_simulados DROP CONSTRAINT IF EXISTS teacher_simulados_module_id_fkey;
ALTER TABLE teacher_simulados ALTER COLUMN id TYPE TEXT;
ALTER TABLE teacher_simulados ALTER COLUMN teacher_id TYPE TEXT;
ALTER TABLE teacher_simulados ALTER COLUMN module_id TYPE TEXT;
DROP INDEX IF EXISTS idx_teacher_simulados_teacher;
