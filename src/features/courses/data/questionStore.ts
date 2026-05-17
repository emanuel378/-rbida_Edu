import { create } from 'zustand'
import { subscribeQuestions, addQuestion as addQuestionToFirestore, deleteQuestion as deleteQuestionFromFirestore, generateQuestionCode } from './questionsService'
import type { Question, Comment, SimuladoResult } from './mock'
import { mockQuestions } from './mock'

const initData = <T>(key: string, mockData: T[]): T[] => {
  const saved = localStorage.getItem(key)
  if (!saved) {
    localStorage.setItem(key, JSON.stringify(mockData))
    return mockData
  }
  return JSON.parse(saved)
}

const ensureCode = (q: Question): Question => {
  if (!q.code) return { ...q, code: generateQuestionCode() }
  return q
}

const fallbackLocal = (): Question[] => {
  const saved = localStorage.getItem('questions')
  if (saved) {
    const parsed: Question[] = JSON.parse(saved)
    return parsed.map(ensureCode)
  }
  return mockQuestions
}

interface QuestionState {
  questions: Question[]
  comments: Comment[]
  results: SimuladoResult[]
  addQuestion: (question: Question) => void
  deleteQuestion: (questionId: string) => void
  addComment: (comment: Comment) => void
  getComments: (lessonId: string) => Comment[]
  addResult: (result: SimuladoResult) => void
  getResults: () => SimuladoResult[]
  syncLocalToFirestore: () => Promise<void>
}

export const useQuestionStore = create<QuestionState>((set, get) => {
  let usingFirestore = false

  subscribeQuestions(
    (questions) => {
      usingFirestore = true
      set({ questions: questions.map(ensureCode) })
    },
    () => {
      if (!usingFirestore) {
        set({ questions: fallbackLocal() })
      }
    }
  )

  return {
    questions: fallbackLocal(),
    comments: initData('comments', []),
    results: initData('results', []),

    addQuestion: (question) => {
      const q = ensureCode(question)
      if (usingFirestore) {
        addQuestionToFirestore(q).catch(() => {
          const questions = [...get().questions, q]
          localStorage.setItem('questions', JSON.stringify(questions))
          set({ questions })
        })
      } else {
        const questions = [...get().questions, q]
        localStorage.setItem('questions', JSON.stringify(questions))
        set({ questions })
      }
    },

    deleteQuestion: (questionId) => {
      if (usingFirestore) {
        deleteQuestionFromFirestore(questionId).catch(() => {
          const questions = get().questions.filter(q => q.id !== questionId)
          localStorage.setItem('questions', JSON.stringify(questions))
          set({ questions })
        })
      } else {
        const questions = get().questions.filter(q => q.id !== questionId)
        localStorage.setItem('questions', JSON.stringify(questions))
        set({ questions })
      }
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

    syncLocalToFirestore: async () => {
      const local = localStorage.getItem('questions')
      if (!local) return
      const localQuestions: Question[] = JSON.parse(local)
      if (localQuestions.length === 0) return
      for (const q of localQuestions) {
        await addQuestionToFirestore(ensureCode(q))
      }
      localStorage.removeItem('questions')
    },
  }
})
