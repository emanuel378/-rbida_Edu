import { create } from 'zustand'
import { mockUsers, type User } from '../../courses/data/mock'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import { generateId } from '../../../lib/id'

const loadUsers = (): User[] => {
  const saved = localStorage.getItem('users')
  if (!saved) return mockUsers
  return JSON.parse(saved)
}

interface AuthState {
  user: User | null
  users: User[]
  sessionToken: string | null
  supabaseReady: boolean
  login: (user: User) => void
  logout: () => void
  claimSession: () => Promise<void>
  ensureSessionToken: () => Promise<void>
  checkSingleSession: () => Promise<boolean>
  approveTeacher: (userId: string) => void
  rejectTeacher: (userId: string) => Promise<{ error: string | null }>
  loadUsers: () => void
  loginWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (name: string, email: string, password: string, role: 'aluno' | 'professor', acceptedTerms: boolean) => Promise<{ error: string | null }>
  logoutFromSupabase: () => Promise<void>
  loadFromSupabase: () => Promise<void>
  updateProfile: (updates: { name?: string; phone?: string; cpf?: string; avatarUrl?: string }) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  uploadAvatar: (file: File) => Promise<{ error: string | null; url?: string }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })(),
  users: loadUsers(),
  sessionToken: localStorage.getItem('sessionToken'),
  supabaseReady: false,

  login: (user) => {
    localStorage.setItem('user', JSON.stringify({ ...user, lastLogin: new Date().toISOString() }))
    set({ user: { ...user, lastLogin: new Date().toISOString() } })
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('sessionToken')
    set({ user: null, sessionToken: null })
  },

  // Grava um token novo em profiles.active_session_token, "derrubando"
  // qualquer outro aparelho logado com a mesma conta de aluno — só
  // deve ser chamado num login explícito (não numa restauração de sessão).
  claimSession: async () => {
    const user = get().user
    if (!user || user.role !== 'aluno' || !isSupabaseConfigured()) return
    const token = generateId()
    localStorage.setItem('sessionToken', token)
    set({ sessionToken: token })
    await supabase.from('profiles').update({ active_session_token: token }).eq('id', user.id)
  },

  // Chamado ao restaurar uma sessão existente (refresh de página). Não
  // "derruba" ninguém: só adota o token que já é deste aparelho, ou
  // reivindica a sessão se ainda não houver nenhum token registrado.
  ensureSessionToken: async () => {
    const user = get().user
    if (!user || user.role !== 'aluno' || !isSupabaseConfigured()) return
    if (localStorage.getItem('sessionToken')) {
      set({ sessionToken: localStorage.getItem('sessionToken') })
      return
    }
    const { data } = await supabase.from('profiles').select('active_session_token').eq('id', user.id).maybeSingle()
    const dbToken = (data as { active_session_token?: string | null } | null)?.active_session_token
    if (dbToken) {
      localStorage.setItem('sessionToken', dbToken)
      set({ sessionToken: dbToken })
      return
    }
    await get().claimSession()
  },

  // Compara o token local com o gravado no perfil. Se outro aparelho
  // fez login depois (sobrescrevendo o token), desloga este aparelho.
  checkSingleSession: async () => {
    const user = get().user
    const localToken = get().sessionToken
    if (!user || user.role !== 'aluno' || !isSupabaseConfigured() || !localToken) return true
    const { data } = await supabase.from('profiles').select('active_session_token').eq('id', user.id).maybeSingle()
    const dbToken = (data as { active_session_token?: string | null } | null)?.active_session_token
    if (dbToken && dbToken !== localToken) {
      if (isSupabaseConfigured()) await supabase.auth.signOut()
      localStorage.removeItem('user')
      localStorage.removeItem('sessionToken')
      set({ user: null, sessionToken: null })
      return false
    }
    return true
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
          phone: profile.phone ?? undefined,
          cpf: profile.cpf ?? undefined,
          avatarUrl: profile.avatar_url ?? undefined,
        }
        localStorage.setItem('user', JSON.stringify(user))
        set({ user })
        await get().claimSession()
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
        await get().claimSession()
      }
    }
    return { error: null }
  },

  logoutFromSupabase: async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
    localStorage.removeItem('user')
    localStorage.removeItem('sessionToken')
    set({ user: null, sessionToken: null })
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
        phone: p.phone ?? undefined,
        cpf: p.cpf ?? undefined,
        avatarUrl: p.avatar_url ?? undefined,
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
          phone: profile.phone ?? undefined,
          cpf: profile.cpf ?? undefined,
          avatarUrl: profile.avatar_url ?? undefined,
        }
        localStorage.setItem('user', JSON.stringify(user))
        set({ user })
        await get().ensureSessionToken()
      }
    }
  },

  updateProfile: async (updates) => {
    const current = get().user
    if (!current) return { error: 'Usuário não autenticado.' }
    if (!isSupabaseConfigured()) return { error: 'Supabase não configurado.' }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.phone !== undefined && { phone: updates.phone }),
        ...(updates.cpf !== undefined && { cpf: updates.cpf }),
        ...(updates.avatarUrl !== undefined && { avatar_url: updates.avatarUrl }),
      })
      .eq('id', current.id)
    if (error) return { error: error.message }

    const user: User = { ...current, ...updates }
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
    return { error: null }
  },

  updatePassword: async (newPassword) => {
    if (!isSupabaseConfigured()) return { error: 'Supabase não configurado.' }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: error.message }
    return { error: null }
  },

  uploadAvatar: async (file) => {
    const current = get().user
    if (!current) return { error: 'Usuário não autenticado.' }
    if (!isSupabaseConfigured()) return { error: 'Supabase não configurado.' }

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `avatars/${current.id}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('education-files')
      .upload(path, file, { upsert: true })
    if (uploadError) return { error: uploadError.message }

    const { data } = supabase.storage.from('education-files').getPublicUrl(path)
    const url = data.publicUrl
    const { error } = await get().updateProfile({ avatarUrl: url })
    if (error) return { error }
    return { error: null, url }
  },
}))
