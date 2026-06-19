import { create } from 'zustand'
import { subscribeQuestions, addQuestion as addQuestionToFirestore, deleteQuestion as deleteQuestionFromFirestore, updateQuestion as updateQuestionToFirestore, generateQuestionCode } from './questionsService'
import type { Question, Comment, SimuladoResult, QuestionStats, QuestionAnswerRecord } from './mock'
import { mockQuestions, mockQuestionStats } from './mock'

const CACHE_KEY = 'questions_cache'
const STATS_KEY = 'question_stats'

const initData = <T>(key: string, defaultData: T[]): T[] => {
  const saved = localStorage.getItem(key)
  if (!saved) return defaultData
  return JSON.parse(saved)
}

const ensureCode = (q: Question): Question => {
  if (!q.code) return { ...q, code: generateQuestionCode() }
  return q
}

const cacheQuestions = (questions: Question[]) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(questions))
}

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

const saveStats = (stats: QuestionStats[]) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

interface QuestionState {
  questions: Question[]
  comments: Comment[]
  results: SimuladoResult[]
  firestoreReady: boolean
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
  syncLocalToFirestore: () => Promise<void>
}

export const useQuestionStore = create<QuestionState>((set, get) => {
  let firestoreInitialized = false
  let unsubscribe: (() => void) | null = null

  unsubscribe = subscribeQuestions(
    (questions) => {
      const normalized = questions.map(ensureCode)
      cacheQuestions(normalized)
      firestoreInitialized = true
      set({ questions: normalized, firestoreReady: true })
    },
    () => {
      if (!firestoreInitialized) {
        const cached = loadCached()
        set({ questions: cached.length > 0 ? cached : [], firestoreReady: true })
      }
    }
  )

  const cached = loadCached()
  const initialStats = loadStats()

  return {
    questions: cached,
    comments: initData('comments', []),
    results: initData('results', []),
    questionStats: initialStats,
    firestoreReady: false,

    addQuestion: (question) => {
      const q = ensureCode(question)
      addQuestionToFirestore(q).then(() => {
        console.log('Questão salva no Firestore:', q.id)
      }).catch((err) => {
        console.error('Erro ao salvar no Firestore, salvando localmente:', err)
        const questions = [...get().questions, q]
        cacheQuestions(questions)
        set({ questions })
      })
    },

    deleteQuestion: (questionId) => {
      deleteQuestionFromFirestore(questionId).catch(() => {
        const questions = get().questions.filter(q => q.id !== questionId)
        cacheQuestions(questions)
        set({ questions })
      })
    },

    updateQuestion: (question) => {
      const q = ensureCode(question)
      const questions = get().questions.map(item => item.id === q.id ? q : item)
      cacheQuestions(questions)
      set({ questions })
      updateQuestionToFirestore(q).catch((err) => {
        console.error('Erro ao atualizar questão no Firestore:', err)
      })
    },

    addComment: (comment) => {
      const comments = [...get().comments, comment]
      localStorage.setItem('comments', JSON.stringify(comments))
      set({ comments })
    },

    getComments: (lessonId) => {
      return get().comments.filter(c => c.lessonId === lessonId)
    },

    addResult: (result) => {
      const results = [...get().results, result]
      localStorage.setItem('results', JSON.stringify(results))
      set({ results })
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
      saveStats(stats)
      set({ questionStats: stats })
    },

    syncLocalToFirestore: async () => {
      const local = loadCached()
      if (local.length === 0) return
      for (const q of local) {
        await addQuestionToFirestore(ensureCode(q))
      }
    },
  }
})
