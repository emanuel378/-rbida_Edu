import { create } from 'zustand'

export interface ScheduleEntry {
  id: string
  lessonId: string
  day: string
  time: string
  type: 'aula' | 'simulado' | 'revisao' | 'prova'
  completed: boolean
  userId: string
  title: string
  courseName: string
}

const STORAGE_KEY = 'schedule_entries'

const loadEntries = (): ScheduleEntry[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const saveEntries = (entries: ScheduleEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

interface ScheduleStore {
  entries: ScheduleEntry[]
  addEntry: (entry: Omit<ScheduleEntry, 'id'>) => void
  removeEntry: (id: string) => void
  updateEntry: (id: string, updates: Partial<ScheduleEntry>) => void
  toggleComplete: (id: string) => void
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  entries: loadEntries(),

  addEntry: (entry) => {
    const newEntry = { ...entry, id: Date.now().toString() }
    const entries = [...get().entries, newEntry]
    saveEntries(entries)
    set({ entries })
  },

  removeEntry: (id) => {
    const entries = get().entries.filter(e => e.id !== id)
    saveEntries(entries)
    set({ entries })
  },

  updateEntry: (id, updates) => {
    const entries = get().entries.map(e => e.id === id ? { ...e, ...updates } : e)
    saveEntries(entries)
    set({ entries })
  },

  toggleComplete: (id) => {
    const entries = get().entries.map(e =>
      e.id === id ? { ...e, completed: !e.completed } : e
    )
    saveEntries(entries)
    set({ entries })
  },
}))
