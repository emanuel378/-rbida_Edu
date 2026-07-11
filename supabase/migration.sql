-- ============================================================
-- ÓrbitaEdu — Migração completa do Firebase/localStorage para Supabase
-- NOTA: Usamos TEXT para todos os IDs porque o app usa login
-- mockado com IDs numéricos ("1", "2", "3", "c1", "d1").
-- Para ambiente real com Supabase Auth, troque de volta para UUID.
-- ============================================================

-- 1. PROFILES
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('aluno', 'professor', 'admin')),
  approved BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CURSOS
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  teacher_id TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MÓDULOS (disciplinas dentro de um curso)
CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  teacher_id TEXT NOT NULL
);

-- 4. AULAS
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT DEFAULT '',
  pdf_url TEXT DEFAULT '',
  order_index INTEGER NOT NULL
);

-- 5. TÓPICOS / ASSUNTOS
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  title TEXT NOT NULL
);

-- 6. QUESTÕES
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  module_id TEXT,
  topic_id TEXT,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  banca TEXT,
  assunto TEXT,
  nivel TEXT,
  ano TEXT,
  image_url TEXT,
  gabarito_comentado TEXT,
  aulas_relacionadas JSONB DEFAULT '[]',
  material_url TEXT,
  material_type TEXT CHECK (material_type IN ('image', 'pdf')),
  aula_relacionada TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ESTATÍSTICAS DAS QUESTÕES
CREATE TABLE question_stats (
  question_id TEXT PRIMARY KEY,
  answers JSONB NOT NULL DEFAULT '{}',
  total INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0
);

-- 8. RESPOSTAS INDIVIDUAIS DOS ALUNOS
-- NOTA: não guardamos qual alternativa foi marcada, apenas se o aluno
-- acertou ou errou a questão (um registro por aluno/questão).
CREATE TABLE question_answers (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_id, user_id)
);

-- 9. MATRÍCULAS
CREATE TABLE enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed_lessons JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- 10. COMENTÁRIOS NAS AULAS
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. MENSAGENS (dúvidas, solicitações de preço/exclusão/publicação)
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  module_id TEXT,
  lesson_id TEXT,
  from_user_id TEXT NOT NULL,
  from_user_name TEXT NOT NULL,
  to_teacher_id TEXT NOT NULL,
  text TEXT NOT NULL,
  reply TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  replied_at TIMESTAMPTZ,
  type TEXT CHECK (type IN ('question', 'price_request', 'delete_request', 'publish_request')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  resolved_at TIMESTAMPTZ,
  target_type TEXT CHECK (target_type IN ('course', 'module', 'lesson', 'question')),
  target_name TEXT
);

-- 12. RESULTADOS DE SIMULADOS (ranking)
CREATE TABLE simulado_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  date TIMESTAMPTZ DEFAULT now()
);

-- 13. SIMULADOS CRIADOS POR PROFESSORES
CREATE TABLE teacher_simulados (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  module_id TEXT,
  question_ids JSONB DEFAULT '[]',
  time_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SEGURANÇA EM NÍVEL DE LINHA (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulado_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_simulados ENABLE ROW LEVEL SECURITY;

-- NOTA: RLS foi removido porque o app usa login mockado.
-- Em vez disso, execute disable-rls-dev.sql para desabilitar RLS.
-- Se quiser ativar RLS no futuro, recrie as políticas com auth.uid().

-- ============================================================
-- ARMAZENAMENTO (STORAGE) PARA PDFs E IMAGENS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('education-files', 'education-files', true)
ON CONFLICT (id) DO NOTHING;

-- NOTA: As políticas de storage são definidas no disable-rls-dev.sql
-- para desenvolvimento (acesso público).

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_topics_module ON topics(module_id);
CREATE INDEX IF NOT EXISTS idx_questions_module ON questions(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_messages_course ON messages(course_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_teacher ON messages(to_teacher_id);
CREATE INDEX IF NOT EXISTS idx_comments_lesson ON comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_teacher_simulados_teacher ON teacher_simulados(teacher_id);
