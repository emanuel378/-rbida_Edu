import { create } from 'zustand'
import { fetchQuestions, addQuestion as addQuestionToSupabase, deleteQuestion as deleteQuestionFromSupabase, updateQuestion as updateQuestionToSupabase, generateQuestionCode } from './questionsService'
import type { Question, Comment, SimuladoResult, QuestionStats, QuestionAnswerRecord } from './mock'
import { mockQuestions, mockQuestionStats } from './mock'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'

const CACHE_KEY = 'questions_cache'
const STATS_KEY = 'question_stats'

const loadCached = (): Question[] => {
  const saved = localStorage.getItem(CACHE_KEY)
  if (!saved) {
    const seeded = mockQuestions.map(ensureCode)
    localStorage.setItem(CACHE_KEY, JSON.stringify(seeded))
    return seeded
  }
  return JSON.parse(saved).map(ensureCode)
}

const loadStats = (): QuestionStats[] => {
  const saved = localStorage.getItem(STATS_KEY)
  if (!saved) {
    localStorage.setItem(STATS_KEY, JSON.stringify(mockQuestionStats))
    return mockQuestionStats
  }
  return JSON.parse(saved)
}

const ensureCode = (q: Question): Question => {
  if (!q.code) return { ...q, code: generateQuestionCode() }
  return q
}

interface QuestionState {
  questions: Question[]
  comments: Comment[]
  results: SimuladoResult[]
  supabaseReady: boolean
  questionStats: QuestionStats[]
  addQuestion: (question: Question) => void
  deleteQuestion: (questionId: string) => void
  updateQuestion: (question: Question) => void
  addComment: (comment: Comment) => void
  getComments: (lessonId: string) => Comment[]
  addResult: (result: SimuladoResult) => void
  getResults: () => SimuladoResult[]
  getQuestionStats: (questionId: string) => QuestionStats | undefined
  recordAnswer: (record: QuestionAnswerRecord) => void
  loadFromSupabase: () => Promise<void>
}

export const useQuestionStore = create<QuestionState>((set, get) => {
  const cached = loadCached()
  const initialStats = loadStats()

  if (isSupabaseConfigured()) {
    fetchQuestions().then((questions) => {
      if (questions.length > 0) {
        set({ questions: questions.map(ensureCode), supabaseReady: true })
      }
    })
  }

  return {
    questions: cached,
    comments: [],
    results: [],
    questionStats: initialStats,
    supabaseReady: false,

    addQuestion: (question) => {
      const q = ensureCode(question)
      const questions = [...get().questions, q]
      set({ questions })
      addQuestionToSupabase(q).catch((err) => {
        console.error('Erro ao salvar questão no Supabase:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
      })
    },

    deleteQuestion: (questionId) => {
      const questions = get().questions.filter(q => q.id !== questionId)
      set({ questions })
      deleteQuestionFromSupabase(questionId).catch((err) => {
        console.error('Erro ao deletar questão no Supabase:', err)
      })
    },

    updateQuestion: (question) => {
      const q = ensureCode(question)
      const questions = get().questions.map(item => item.id === q.id ? q : item)
      set({ questions })
      updateQuestionToSupabase(q).catch((err) => {
        console.error('Erro ao atualizar questão no Supabase:', err)
      })
    },

    addComment: (comment) => {
      const comments = [...get().comments, comment]
      set({ comments })
      if (isSupabaseConfigured()) {
        supabase.from('comments').insert({
          lesson_id: comment.lessonId,
          user_id: comment.userId,
          user_name: comment.userName,
          text: comment.text,
          created_at: comment.createdAt,
        }).then(({ error }) => {
          if (error) console.error('Erro ao salvar comentário no Supabase:', error)
        })
      }
    },

    getComments: (lessonId) => {
      return get().comments.filter(c => c.lessonId === lessonId)
    },

    addResult: (result) => {
      const results = [...get().results, result]
      set({ results })
      if (isSupabaseConfigured()) {
        supabase.from('simulado_results').insert({
          user_id: result.userId,
          user_name: result.userName,
          score: result.score,
          total: result.total,
          date: result.date,
        }).then(({ error }) => {
          if (error) console.error('Erro ao salvar resultado no Supabase:', error)
        })
      }
    },

    getResults: () => {
      return get().results.sort((a, b) => b.score - a.score)
    },

    getQuestionStats: (questionId) => {
      return get().questionStats.find(s => s.questionId === questionId)
    },

    recordAnswer: (record) => {
      const stats = [...get().questionStats]
      let qStat = stats.find(s => s.questionId === record.questionId)
      if (!qStat) {
        qStat = { questionId: record.questionId, answers: {}, total: 0, correct: 0 }
        stats.push(qStat)
      }
      qStat.total += 1
      const prev = qStat.answers[record.selectedAnswer] || 0
      qStat.answers = { ...qStat.answers, [record.selectedAnswer]: prev + 1 }
      if (record.correct) qStat.correct += 1
      set({ questionStats: stats })

      if (isSupabaseConfigured()) {
        supabase.from('question_answers').insert({
          question_id: record.questionId,
          selected_answer: record.selectedAnswer,
          correct: record.correct,
          user_id: record.userId,
          timestamp: record.timestamp,
        }).then(({ error }) => {
          if (error) console.error('Erro ao salvar resposta no Supabase:', error)
        })

        supabase.from('question_stats').upsert({
          question_id: record.questionId,
          answers: qStat!.answers,
          total: qStat!.total,
          correct: qStat!.correct,
        }, { onConflict: 'question_id' }).then(({ error }) => {
          if (error) console.error('Erro ao atualizar stats no Supabase:', error)
        })
      }
    },

    loadFromSupabase: async () => {
      if (!isSupabaseConfigured()) return

      const { data: commentsData } = await supabase.from('comments').select('*').order('created_at', { ascending: false })
      if (commentsData) {
        const comments: Comment[] = commentsData.map((r: any) => ({
          id: r.id,
          lessonId: r.lesson_id,
          userId: r.user_id,
          userName: r.user_name,
          text: r.text,
          createdAt: r.created_at,
        }))
        set({ comments })
      }

      const { data: resultsData } = await supabase.from('simulado_results').select('*').order('date', { ascending: false })
      if (resultsData) {
        const results: SimuladoResult[] = resultsData.map((r: any) => ({
          userId: r.user_id,
          userName: r.user_name,
          score: r.score,
          total: r.total,
          date: r.date,
        }))
        set({ results })
      }
    },
  }
})
