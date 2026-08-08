import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Idempotente: usado tanto pelo webhook (confirmação assíncrona do Pix/cartão)
// quanto pelo create-payment (confirmação síncrona de cartão aprovado na hora),
// então sempre confere se já existe matrícula antes de inserir.
export async function ensureEnrollment(admin: SupabaseClient, userId: string, courseId: string) {
  const { data: existing } = await admin
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (existing) return

  const { error } = await admin.from('enrollments').insert({
    id: crypto.randomUUID(),
    user_id: userId,
    course_id: courseId,
    progress: 0,
    completed_lessons: [],
    created_at: new Date().toISOString(),
  })
  if (error) console.error('Falha ao criar enrollment:', error.message)
}
