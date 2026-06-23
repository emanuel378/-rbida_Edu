import { create } from 'zustand'
import { mockUsers, type User } from '../../courses/data/mock'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'

const loadUsers = (): User[] => {
  const saved = localStorage.getItem('users')
  if (!saved) return mockUsers
  return JSON.parse(saved)
}

interface AuthState {
  user: User | null
  users: User[]
  supabaseReady: boolean
  login: (user: User) => void
  logout: () => void
  approveTeacher: (userId: string) => void
  loadUsers: () => void
  loginWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (name: string, email: string, password: string, role: 'aluno' | 'professor') => Promise<{ error: string | null }>
  logoutFromSupabase: () => Promise<void>
  loadFromSupabase: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })(),
  users: loadUsers(),
  supabaseReady: false,

  login: (user) => {
    localStorage.setItem('user', JSON.stringify({ ...user, lastLogin: new Date().toISOString() }))
    set({ user: { ...user, lastLogin: new Date().toISOString() } })
  },

  logout: () => {
    localStorage.removeItem('user')
    set({ user: null })
  },

  approveTeacher: (userId) => {
    const users = get().users.map((u: User) => u.id === userId ? { ...u, approved: true } : u)
    set({ users })
    if (isSupabaseConfigured()) {
      supabase.from('profiles').update({ approved: true }).eq('id', userId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  loadUsers: () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    set({ users })
  },

  loginWithEmail: async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase não configurado. Use o login mockado.' }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        const user: User = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          approved: profile.approved ?? false,
          lastLogin: new Date().toISOString(),
        }
        localStorage.setItem('user', JSON.stringify(user))
        set({ user })
      }
    }
    return { error: null }
  },

  signUp: async (name, email, password, role) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase não configurado.' }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    })
    if (error) return { error: error.message }

    if (data.user) {
      const user: User = {
        id: data.user.id,
        name,
        email,
        role,
        approved: role === 'aluno' ? true : false,
        lastLogin: new Date().toISOString(),
      }
      localStorage.setItem('user', JSON.stringify(user))
      set({ user })
    }
    return { error: null }
  },

  logoutFromSupabase: async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
    localStorage.removeItem('user')
    set({ user: null })
  },

  loadFromSupabase: async () => {
    if (!isSupabaseConfigured()) return

    const { data } = await supabase.from('profiles').select('*')
    if (data && data.length > 0) {
      const users: User[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role,
        approved: p.approved ?? false,
        lastLogin: p.last_login ?? undefined,
      }))
      set({ users, supabaseReady: true })

      const saved = localStorage.getItem('user')
      if (saved) {
        const localUser = JSON.parse(saved)
        const match = users.find(u => u.id === localUser.id)
        if (!match) {
          localStorage.removeItem('user')
          set({ user: null })
        }
      }
    }

    const { data: session } = await supabase.auth.getSession()
    if (session?.session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single()

      if (profile) {
        const user: User = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          approved: profile.approved ?? false,
          lastLogin: new Date().toISOString(),
        }
        localStorage.setItem('user', JSON.stringify(user))
        set({ user })
      }
    }
  },
}))
