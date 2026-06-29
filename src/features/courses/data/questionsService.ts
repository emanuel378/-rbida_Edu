import type { Question } from './mock'
import { supabase } from '../../../lib/supabase'

export const generateQuestionCode = () =>
  'Q' + Date.now().toString(36).toUpperCase()

const toRow = (q: Question) => ({
  id: q.id,
  code: q.code ?? '',
  question: q.question,
  options: q.options,
  correct_answer: q.correctAnswer,
  module_id: q.moduleId ?? '',
  topic_id: q.topicId ?? '',
  assunto: q.assunto ?? '',
  banca: q.banca ?? '',
  ano: q.ano ?? '',
  nivel: q.nivel ?? '',
  gabarito_comentado: q.gabaritoComentado ?? '',
  image_url: q.materialUrl ?? '',
  aulas_relacionadas: q.aulaRelacionada ? [q.aulaRelacionada] : [],
  disciplina: q.moduleId ?? '',
})

const fromRow = (row: Record<string, unknown>): Question => ({
  id: row.id as string,
  code: row.code as string,
  question: row.question as string,
  options: row.options as string[],
  correctAnswer: row.correct_answer as number,
  moduleId: row.module_id as string,
  topicId: row.topic_id as string,
  assunto: row.assunto as string,
  banca: row.banca as string,
  ano: row.ano as string,
  nivel: row.nivel as string,
  gabaritoComentado: row.gabarito_comentado as string,
  materialUrl: (row.image_url ?? '') as string,
  materialType: undefined,
  aulaRelacionada: Array.isArray(row.aulas_relacionadas)
    ? (row.aulas_relacionadas[0] ?? '')
    : ((row.aulas_relacionadas as string) ?? ''),
})

export const fetchQuestions = async (): Promise<Question[]> => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
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