import type { QuestionAnswerRecord, QuestionStats } from './mock'
import { supabase } from '../../../lib/supabase'

const answerId = (questionId: string, userId: string) => `${questionId}_${userId}`

const fromAnswerRow = (row: Record<string, unknown>): QuestionAnswerRecord => ({
  questionId: row.question_id as string,
  correct: row.correct as boolean,
  userId: row.user_id as string,
  timestamp: row.timestamp as string,
})

export const fetchAnswerHistory = async (): Promise<QuestionAnswerRecord[]> => {
  const { data, error } = await supabase.from('question_answers').select('*')
  if (error) throw error
  return (data ?? []).map(fromAnswerRow)
}

export const saveAnswerRecord = async (record: QuestionAnswerRecord): Promise<void> => {
  const { error } = await supabase.from('question_answers').upsert({
    id: answerId(record.questionId, record.userId),
    question_id: record.questionId,
    correct: record.correct,
    user_id: record.userId,
    timestamp: record.timestamp,
  }, { onConflict: 'question_id,user_id' })
  if (error) {
    console.error('Erro ao salvar resposta:', error)
    throw new Error(error.message)
  }
}

const fromStatsRow = (row: Record<string, unknown>): QuestionStats => ({
  questionId: row.question_id as string,
  answers: (row.answers as Record<number, number>) ?? {},
  total: (row.total as number) ?? 0,
  correct: (row.correct as number) ?? 0,
})

export const fetchQuestionStats = async (): Promise<QuestionStats[]> => {
  const { data, error } = await supabase.from('question_stats').select('*')
  if (error) throw error
  return (data ?? []).map(fromStatsRow)
}

export const saveQuestionStats = async (stats: QuestionStats): Promise<void> => {
  const { error } = await supabase.from('question_stats').upsert({
    question_id: stats.questionId,
    answers: stats.answers,
    total: stats.total,
    correct: stats.correct,
  })
  if (error) {
    console.error('Erro ao salvar estatísticas:', error)
    throw new Error(error.message)
  }
}
