import { create } from 'zustand'
import {
  fetchInstitutions,
  addInstitution as addToSupabase,
  deleteInstitution as deleteFromSupabase,
} from './institutionsService'
import type { Institution } from './mock'
import { generateId } from '../../../lib/id'

interface InstitutionState {
  institutions: Institution[]
  loading: boolean
  loadInstitutions: () => Promise<void>
  addInstitution: (name: string) => Promise<void>
  deleteInstitution: (id: string) => Promise<void>
}

export const useInstitutionStore = create<InstitutionState>((set, get) => ({
  institutions: [],
  loading: false,

  loadInstitutions: async () => {
    set({ loading: true })
    try {
      const data = await fetchInstitutions()
      set({ institutions: data })
    } catch (err) {
      console.error('Erro ao carregar instituições do Supabase:', err)
    } finally {
      set({ loading: false })
    }
  },

  addInstitution: async (name) => {
    const institution: Institution = { id: generateId(), name: name.trim() }
    await addToSupabase(institution)
    set({ institutions: [...get().institutions, institution].sort((a, b) => a.name.localeCompare(b.name)) })
  },

  deleteInstitution: async (id) => {
    await deleteFromSupabase(id)
    set({ institutions: get().institutions.filter(i => i.id !== id) })
  },
}))
