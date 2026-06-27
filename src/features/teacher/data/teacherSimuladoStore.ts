import { create } from 'zustand'
import type { Question } from '../../courses/data/mock'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import { generateId } from '../../../lib/id'

export interface TeacherSimulado {
  id: string
  title: string
  teacherId: string
  moduleId?: string
  questionIds: string[]
  timeLimit: number
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
  loadFromSupabase: () => Promise<void>
}

export const useTeacherSimuladoStore = create<TeacherSimuladoState>((set, get) => ({
  simulados: initData(),

  addSimulado: (simulado) => {
    const newSimulado: TeacherSimulado = {
      ...simulado,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    const simulados = [...get().simulados, newSimulado]
    set({ simulados })

    if (isSupabaseConfigured()) {
      supabase.from('teacher_simulados').insert({
        id: newSimulado.id,
        title: newSimulado.title,
        teacher_id: newSimulado.teacherId,
        module_id: newSimulado.moduleId ?? null,
        question_ids: newSimulado.questionIds,
        time_limit: newSimulado.timeLimit,
        created_at: newSimulado.createdAt,
      }).then(({ error }) => { if (error) console.error('Erro ao salvar simulado no Supabase:', error) })
    }
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

  loadFromSupabase: async () => {
    if (!isSupabaseConfigured()) return

    const { data } = await supabase.from('teacher_simulados').select('*')
    if (data && data.length > 0) {
      const simulados: TeacherSimulado[] = data.map((r: any) => ({
        id: r.id,
        title: r.title,
        teacherId: r.teacher_id,
        moduleId: r.module_id,
        questionIds: r.question_ids ?? [],
        timeLimit: r.time_limit,
        createdAt: r.created_at ?? '',
      }))
      set({ simulados })
    }
  },
}))
