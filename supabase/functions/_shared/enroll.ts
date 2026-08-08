import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

function computeExpiresAt(accessDurationDays: number | null): string | null {
  if (!accessDurationDays) return null
  return new Date(Date.now() + accessDurationDays * 24 * 60 * 60 * 1000).toISOString()
}

// Idempotente: usado tanto pelo webhook (confirmação assíncrona do Pix/cartão)
// quanto pelo create-payment (confirmação síncrona de cartão aprovado na hora),
// então sempre confere se já existe matrícula antes de inserir.
//
// Cursos com courses.access_duration_days preenchido têm acesso por tempo
// limitado: a matrícula recebe expires_at e o acesso é revogado depois desse
// prazo (ver hasQuestionBankAccess no frontend). Se o aluno comprar de novo
// depois de expirado, renova a partir de agora em vez de criar duplicata.
export async function ensureEnrollment(admin: SupabaseClient, userId: string, courseId: string) {
  const { data: existing } = await admin
    .from('enrollments')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  const { data: course } = await admin
    .from('courses')
    .select('access_duration_days')
    .eq('id', courseId)
    .maybeSingle()

  const expiresAt = computeExpiresAt(course?.access_duration_days ?? null)

  if (!existing) {
    const { error } = await admin.from('enrollments').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      course_id: courseId,
      progress: 0,
      completed_lessons: [],
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    })
    if (error) console.error('Falha ao criar enrollment:', error.message)
    return
  }

  const wasExpired = existing.expires_at && new Date(existing.expires_at) <= new Date()
  if (wasExpired) {
    const { error } = await admin.from('enrollments').update({ expires_at: expiresAt }).eq('id', existing.id)
    if (error) console.error('Falha ao renovar enrollment:', error.message)
  }
}
