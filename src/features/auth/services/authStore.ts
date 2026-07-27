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
  rejectTeacher: (userId: string) => Promise<{ error: string | null }>
  loadUsers: () => void
  loginWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (name: string, email: string, password: string, role: 'aluno' | 'professor', acceptedTerms: boolean) => Promise<{ error: string | null }>
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

  // Rejeita um professor pendente apagando o profile (a conta do
  // Supabase Auth em si continua existindo, só não tem mais profile
  // pra logar no app). Requer a policy "profiles_delete_admin".
  rejectTeacher: async (userId) => {
    if (!isSupabaseConfigured()) return { error: 'Supabase não configurado.' }
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) return { error: error.message }
    const users = get().users.filter((u: User) => u.id !== userId)
    set({ users })
    return { error: null }
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
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

      // Se o cadastro exigiu confirmação de e-mail, o perfil ainda não foi
      // criado no signUp (não havia sessão real naquele momento). Cria aqui,
      // no primeiro login com sessão de verdade, usando os metadados salvos.
      if (!profile) {
        const meta = data.user.user_metadata as { name?: string; role?: 'aluno' | 'professor'; terms_accepted_at?: string } | null
        const role = meta?.role ?? 'aluno'
        const approved = role === 'aluno'
        const { data: created, error: profileError } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, name: meta?.name ?? email, email, role, approved, terms_accepted_at: meta?.terms_accepted_at ?? null })
          .select('*')
          .single()
        if (profileError) return { error: profileError.message }
        profile = created
      }

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

  signUp: async (name, email, password, role, acceptedTerms) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase não configurado.' }
    }
    if (!acceptedTerms) {
      return { error: 'É necessário aceitar o Termo de Uso, a Política de Privacidade e a Política de Cancelamento e Reembolso.' }
    }
    const termsAcceptedAt = new Date().toISOString()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, terms_accepted_at: termsAcceptedAt } },
    })
    if (error) return { error: error.message }

    if (data.user) {
      const approved = role === 'aluno'

      // Só dá pra criar o perfil aqui se o signUp já retornou uma sessão
      // (confirmação de e-mail desativada no projeto). Caso contrário, o
      // perfil é criado no primeiro loginWithEmail, após a confirmação.
      if (data.session) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          name,
          email,
          role,
          approved,
          terms_accepted_at: termsAcceptedAt,
        })
        if (profileError) return { error: profileError.message }
      }

      const user: User = {
        id: data.user.id,
        name,
        email,
        role,
        approved,
        lastLogin: new Date().toISOString(),
      }
      if (data.session) {
        localStorage.setItem('user', JSON.stringify(user))
        set({ user })
      }
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
