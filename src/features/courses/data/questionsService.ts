import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import type { Question } from './mock'

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateQuestionCode(): string {
  let result = 'QST-'
  for (let i = 0; i < 4; i++) {
    result += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length))
  }
  return result
}

function toQuestion(row: any): Question {
  return {
    id: row.id,
    code: row.code,
    moduleId: row.module_id,
    topicId: row.topic_id,
    question: row.question,
    options: row.options ?? [],
    correctAnswer: row.correct_answer,
    banca: row.banca,
    assunto: row.assunto,
    nivel: row.nivel,
    ano: row.ano,
    imageUrl: row.image_url,
    gabaritoComentado: row.gabarito_comentado,
    aulasRelacionadas: row.aulas_relacionadas,
    materialUrl: row.material_url,
    materialType: row.material_type,
    aulaRelacionada: row.aula_relacionada,
  }
}

function toDb(q: Question) {
  return {
    id: q.id,
    code: q.code,
    module_id: q.moduleId || null,
    topic_id: q.topicId || null,
    question: q.question,
    options: q.options,
    correct_answer: q.correctAnswer,
    banca: q.banca || null,
    assunto: q.assunto || null,
    nivel: q.nivel || null,
    ano: q.ano || null,
    image_url: q.imageUrl || null,
    gabarito_comentado: q.gabaritoComentado || null,
    aulas_relacionadas: q.aulasRelacionadas ?? null,
    material_url: q.materialUrl || null,
    material_type: q.materialType || null,
    aula_relacionada: q.aulaRelacionada || null,
  }
}

export async function fetchQuestions(): Promise<Question[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar questões do Supabase:', error)
    return []
  }

  return (data || []).map(toQuestion)
}

export async function addQuestion(question: Question): Promise<void> {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase
    .from('questions')
    .insert(toDb(question))

  if (error) {
    console.error('Erro ao adicionar questão no Supabase:', JSON.stringify(error, null, 2))
    throw error
  }
}

export async function deleteQuestion(questionId: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) {
    console.error('Erro ao deletar questão no Supabase:', error)
    throw error
  }
}

export async function updateQuestion(question: Question): Promise<void> {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase
    .from('questions')
    .update(toDb(question))
    .eq('id', question.id)

  if (error) {
    console.error('Erro ao atualizar questão no Supabase:', error)
    throw error
  }
}
