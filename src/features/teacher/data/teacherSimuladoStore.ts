import { create } from 'zustand'
import type { Question } from '../../courses/data/mock'

export interface TeacherSimulado {
  id: string
  title: string
  teacherId: string
  disciplineId?: string
  questionIds: string[]
  timeLimit: number // minutos
  createdAt: string
}

const initData = (): TeacherSimulado[] => {
  const saved = localStorage.getItem('teacherSimulados')
  if (!saved) return []
  return JSON.parse(saved)
}

interface TeacherSimuladoState {
  simulados: TeacherSimulado[]
  addSimulado: (simulado: Omit<TeacherSimulado, 'id' | 'createdAt'>) => void
  getSimulado: (id: string) => TeacherSimulado | undefined
  getSimuladosByTeacher: (teacherId: string) => TeacherSimulado[]
  getQuestions: (simuladoId: string, allQuestions: Question[]) => Question[]
}

export const useTeacherSimuladoStore = create<TeacherSimuladoState>((set, get) => ({
  simulados: initData(),

  addSimulado: (simulado) => {
    const newSimulado: TeacherSimulado = {
      ...simulado,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    const simulados = [...get().simulados, newSimulado]
    localStorage.setItem('teacherSimulados', JSON.stringify(simulados))
    set({ simulados })
  },

  getSimulado: (id) => {
    return get().simulados.find(s => s.id === id)
  },

  getSimuladosByTeacher: (teacherId) => {
    return get().simulados.filter(s => s.teacherId === teacherId)
  },

  getQuestions: (simuladoId, allQuestions) => {
    const simulado = get().simulados.find(s => s.id === simuladoId)
    if (!simulado) return []
    return allQuestions.filter(q => simulado.questionIds.includes(q.id))
  },
}))
