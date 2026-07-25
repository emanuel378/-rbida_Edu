import type { QuestionAnswerRecord, QuestionStats } from './mock'
import { supabase } from '../../../lib/supabase'

const statsFromRow = (row: Record<string, unknown>): QuestionStats => ({
  questionId: row.question_id as string,
  answers: (row.answers as Record<number, number>) ?? {},
  total: (row.total as number) ?? 0,
  correct: (row.correct as number) ?? 0,
})

const answerFromRow = (row: Record<string, unknown>): QuestionAnswerRecord => ({
  questionId: row.question_id as string,
  selectedAnswer: row.selected_answer as number,
  correct: row.correct as boolean,
  userId: row.user_id as string,
  timestamp: row.timestamp as string,
})

export const fetchQuestionStats = async (): Promise<QuestionStats[]> => {
  const { data, error } = await supabase.from('question_stats').select('*')
  if (error) {
    console.error('Erro ao carregar estatísticas:', error)
    return []
  }
  return (data ?? []).map(statsFromRow)
}

export const upsertQuestionStats = async (stat: QuestionStats): Promise<void> => {
  const { error } = await supabase.from('question_stats').upsert({
    question_id: stat.questionId,
    answers: stat.answers,
    total: stat.total,
    correct: stat.correct,
  })
  if (error) console.error('Erro ao salvar estatísticas:', error)
}

export const fetchAnswerHistory = async (): Promise<QuestionAnswerRecord[]> => {
  const { data, error } = await supabase.from('question_answers').select('*')
  if (error) {
    console.error('Erro ao carregar histórico de respostas:', error)
    return []
  }
  return (data ?? []).map(answerFromRow)
}

export const upsertAnswerRecord = async (record: QuestionAnswerRecord): Promise<void> => {
  const { error } = await supabase.from('question_answers').upsert({
    id: `${record.questionId}__${record.userId}`,
    question_id: record.questionId,
    selected_answer: record.selectedAnswer,
    correct: record.correct,
    user_id: record.userId,
    timestamp: record.timestamp,
  })
  if (error) console.error('Erro ao salvar resposta:', error)
}
