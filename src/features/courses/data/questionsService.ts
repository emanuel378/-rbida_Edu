import type { Question } from './mock'
import { supabase } from '../../../lib/supabase'

export const generateQuestionCode = () =>
  'Q' + Date.now().toString(36).toUpperCase()

const toRow = (q: Question) => {
  const matUrl = q.materialUrl ?? ''
  return {
    id: q.id,
    code: q.code ?? '',
    question: q.question,
    options: q.options,
    correct_answer: q.correctAnswer,
    module_id: q.moduleId ?? '',
    topic_id: q.topicId ?? '',
    lesson_id: q.lessonId ?? null,
    assunto: q.assunto ?? '',
    banca: q.banca ?? '',
    institution_id: q.institutionId ?? null,
    ano: q.ano ?? '',
    nivel: q.nivel ?? '',
    gabarito_comentado: q.gabaritoComentado ?? '',
    image_url: matUrl,
    material_url: matUrl,
    material_type: q.materialType ?? null,
    aulas_relacionadas: q.aulaRelacionada ? [q.aulaRelacionada] : [],
    disciplina: q.moduleId ?? '',
    question_image_url: q.questionImageUrl ?? null,
    option_images: q.optionImages ?? [],
  }
}

const fromRow = (row: Record<string, unknown>): Question => ({
  id: row.id as string,
  code: row.code as string,
  question: row.question as string,
  options: row.options as string[],
  correctAnswer: row.correct_answer as number,
  moduleId: row.module_id as string,
  topicId: row.topic_id as string,
  lessonId: (row.lesson_id as string) || undefined,
  assunto: row.assunto as string,
  banca: row.banca as string,
  institutionId: (row.institution_id as string) || undefined,
  ano: row.ano as string,
  nivel: row.nivel as string,
  gabaritoComentado: row.gabarito_comentado as string,
  materialUrl: ((row.material_url as string) || (row.image_url as string) || '') as string,
  materialType: (row.material_type as 'image' | 'pdf') || undefined,
  aulaRelacionada: Array.isArray(row.aulas_relacionadas)
    ? (row.aulas_relacionadas[0] ?? '')
    : ((row.aulas_relacionadas as string) ?? ''),
  questionImageUrl: (row.question_image_url as string) || undefined,
  optionImages: Array.isArray(row.option_images) ? (row.option_images as (string | undefined)[]) : [],
})

const PAGE_SIZE = 1000

export const fetchQuestions = async (): Promise<Question[]> => {
  const rows: Record<string, unknown>[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return rows.map(fromRow)
}

export const addQuestion = async (question: Question): Promise<void> => {
  const row = toRow(question)
  console.log('INSERT →', row)
  const { error } = await supabase.from('questions').insert([row])
  if (error) {
    console.error('Supabase error:', error)
    throw new Error(error.message)
  }
}

export const updateQuestion = async (question: Question): Promise<void> => {
  const row = toRow(question)
  const { error } = await supabase
    .from('questions')
    .update(row)
    .eq('id', question.id)
  if (error) {
    console.error('Supabase error:', error)
    throw new Error(error.message)
  }
}

export const deleteQuestion = async (id: string): Promise<void> => {
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) {
    console.error('Supabase error:', error)
    throw new Error(error.message)
  }
}