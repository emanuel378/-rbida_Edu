import { create } from 'zustand'
import {
  fetchQuestions,
  addQuestion as addToSupabase,
  updateQuestion as updateInSupabase,
  deleteQuestion as deleteFromSupabase,
  generateQuestionCode,
} from './questionsService'
import type { Question, Comment, SimuladoResult, QuestionStats, QuestionAnswerRecord } from './mock'
import { mockQuestionStats } from './mock'

const STATS_KEY = 'question_stats'

const loadStats = (): QuestionStats[] => {
  const saved = localStorage.getItem(STATS_KEY)
  if (!saved) {
    localStorage.setItem(STATS_KEY, JSON.stringify(mockQuestionStats))
    return mockQuestionStats
  }
  return JSON.parse(saved)
}

const saveStats = (stats: QuestionStats[]) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

const ensureCode = (q: Question): Question => {
  if (!q.code) return { ...q, code: generateQuestionCode() }
  return q
}

interface QuestionState {
  questions: Question[]
  comments: Comment[]
  results: SimuladoResult[]
  questionStats: QuestionStats[]
  loading: boolean
  addQuestion: (question: Question) => Promise<void>
  deleteQuestion: (questionId: string) => Promise<void>
  updateQuestion: (question: Question) => Promise<void>
  loadQuestions: () => Promise<void>
  addComment: (comment: Comment) => void
  getComments: (lessonId: string) => Comment[]
  addResult: (result: SimuladoResult) => void
  getResults: () => SimuladoResult[]
  getQuestionStats: (questionId: string) => QuestionStats | undefined
  recordAnswer: (record: QuestionAnswerRecord) => void
}

export const useQuestionStore = create<QuestionState>((set, get) => ({
  questions: [],
  comments: JSON.parse(localStorage.getItem('comments') ?? '[]'),
  results: JSON.parse(localStorage.getItem('results') ?? '[]'),
  questionStats: loadStats(),
  loading: false,

  loadQuestions: async () => {
    set({ loading: true })
    try {
      const data = await fetchQuestions()
      set({ questions: data.map(ensureCode) })
    } catch (err) {
      console.error('Erro ao carregar questões do Supabase:', err)
    } finally {
      set({ loading: false })
    }
  },

  addQuestion: async (question) => {
    const q = ensureCode(question)
    await addToSupabase(q)
    set(state => ({ questions: [q, ...state.questions] }))
  },

  deleteQuestion: async (questionId) => {
    await deleteFromSupabase(questionId)
    set(state => ({
      questions: state.questions.filter(q => q.id !== questionId),
    }))
  },

  updateQuestion: async (question) => {
    const q = ensureCode(question)
    await updateInSupabase(q)
    set(state => ({
      questions: state.questions.map(item => item.id === q.id ? q : item),
    }))
  },

  addComment: (comment) => {
    const comments = [...get().comments, comment]
    localStorage.setItem('comments', JSON.stringify(comments))
    set({ comments })
  },

  getComments: (lessonId) =>
    get().comments.filter(c => c.lessonId === lessonId),

  addResult: (result) => {
    const results = [...get().results, result]
    localStorage.setItem('results', JSON.stringify(results))
    set({ results })
  },

  getResults: () =>
    get().results.sort((a, b) => b.score - a.score),

  getQuestionStats: (questionId) =>
    get().questionStats.find(s => s.questionId === questionId),

  recordAnswer: (record) => {
    const stats = [...get().questionStats]
    let qStat = stats.find(s => s.questionId === record.questionId)
    if (!qStat) {
      qStat = { questionId: record.questionId, answers: {}, total: 0, correct: 0 }
      stats.push(qStat)
    }
    qStat.total += 1
    qStat.answers = {
      ...qStat.answers,
      [record.selectedAnswer]: (qStat.answers[record.selectedAnswer] || 0) + 1,
    }
    if (record.correct) qStat.correct += 1
    saveStats(stats)
    set({ questionStats: stats })
  },
}))