import { create } from 'zustand'
import { mockQuestions } from './mock'
import type { Question, Comment, SimuladoResult } from './mock'

const initData = <T>(key: string, mockData: T[]): T[] => {
  const saved = localStorage.getItem(key)
  if (!saved) {
    localStorage.setItem(key, JSON.stringify(mockData))
    return mockData
  }
  return JSON.parse(saved)
}

interface QuestionState {
  questions: Question[]
  comments: Comment[]
  results: SimuladoResult[]
  addQuestion: (question: Question) => void
  addComment: (comment: Comment) => void
  getComments: (lessonId: string) => Comment[]
  addResult: (result: SimuladoResult) => void
  getResults: () => SimuladoResult[]
}

export const useQuestionStore = create<QuestionState>((set, get) => ({
  questions: initData('questions', mockQuestions),
  comments: initData('comments', []),
  results: initData('results', []),

  addQuestion: (question) => {
    const questions = [...get().questions, question]
    localStorage.setItem('questions', JSON.stringify(questions))
    set({ questions })
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
}))
