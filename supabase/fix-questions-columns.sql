-- Corrige module_id e topic_id de UUID FK para TEXT
-- (o app usa slugs como "conhecimentos_educacionais", não UUIDs)

ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_module_id_fkey;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_topic_id_fkey;
ALTER TABLE questions ALTER COLUMN module_id TYPE TEXT;
ALTER TABLE questions ALTER COLUMN topic_id TYPE TEXT;
