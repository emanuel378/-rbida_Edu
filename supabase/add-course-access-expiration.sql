-- ============================================================
-- Acesso por tempo limitado, por curso — complementa add-course-card-pricing.sql
-- Quando access_duration_days é preenchido, a matrícula desse curso passa a
-- expirar (enrollments.expires_at) e o acesso é revogado automaticamente
-- depois desse prazo. Cursos sem esse campo preenchido continuam com acesso
-- vitalício, sem nenhuma mudança de comportamento.
-- Execute depois do add-course-card-pricing.sql
-- ============================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS access_duration_days INTEGER;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- BANCO DE QUESTÕES: acesso por 3 meses (90 dias) a partir da confirmação do pagamento
UPDATE courses
SET access_duration_days = 90
WHERE title = 'BANCO DE QUESTÕES';
