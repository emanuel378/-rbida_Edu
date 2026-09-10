import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import { generateId } from '../../../lib/id'
import type { Caderno, CadernoAttempt, CadernoFilters } from './notebookTypes'

const NOTEBOOKS_KEY = 'question_notebooks_cache'
const ATTEMPTS_KEY = 'notebook_attempts_cache'
const ATTEMPT_SAVE_DEBOUNCE_MS = 1200

const loadNotebooksCache = (): Caderno[] => {
  try {
    return JSON.parse(localStorage.getItem(NOTEBOOKS_KEY) ?? '[]')
  } catch {
    return []
  }
}

const saveNotebooksCache = (notebooks: Caderno[]) => {
  localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(notebooks))
}

const loadAttemptsCache = (): CadernoAttempt[] => {
  try {
    return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) ?? '[]')
  } catch {
    return []
  }
}

const saveAttemptsCache = (attempts: CadernoAttempt[]) => {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts))
}

// Debounce Supabase writes das respostas de um caderno em andamento — cada seleção
// de resposta salva local (localStorage) na hora, mas só sincroniza com o Supabase
// depois de uma pausa curta, para não disparar um upsert a cada clique.
const pendingAttemptWrites = new Map<string, ReturnType<typeof setTimeout>>()

const upsertAttemptRow = (attempt: CadernoAttempt) => {
  if (!isSupabaseConfigured()) return
  supabase.from('notebook_attempts').upsert({
    id: attempt.id,
    notebook_id: attempt.notebookId,
    user_id: attempt.userId,
    answers: attempt.answers,
    current_index: attempt.currentIndex,
    started_at: attempt.startedAt,
    finished_at: attempt.finishedAt ?? null,
    time_spent_seconds: attempt.timeSpentSeconds,
  }).then(({ error }) => { if (error) console.error('Erro ao salvar progresso do caderno:', error) })
}

const scheduleAttemptWrite = (attempt: CadernoAttempt) => {
  const existing = pendingAttemptWrites.get(attempt.id)
  if (existing) clearTimeout(existing)
  pendingAttemptWrites.set(attempt.id, setTimeout(() => {
    pendingAttemptWrites.delete(attempt.id)
    upsertAttemptRow(attempt)
  }, ATTEMPT_SAVE_DEBOUNCE_MS))
}

interface CreateNotebookInput {
  userId: string
  title: string
  filters: CadernoFilters
  questionIds: string[]
}

interface NotebookState {
  notebooks: Caderno[]
  attempts: CadernoAttempt[]
  loading: boolean
  loadNotebooks: (userId: string) => Promise<void>
  createNotebook: (input: CreateNotebookInput) => Promise<Caderno>
  deleteNotebook: (id: string) => Promise<void>
  getNotebook: (id: string) => Caderno | undefined
  loadAttempt: (notebookId: string, userId: string) => Promise<CadernoAttempt | undefined>
  getAttempt: (notebookId: string, userId: string) => CadernoAttempt | undefined
  startAttempt: (notebookId: string, userId: string) => CadernoAttempt
  saveAttemptProgress: (attempt: CadernoAttempt) => void
  finishAttempt: (attempt: CadernoAttempt) => Promise<void>
  restartAttempt: (attempt: CadernoAttempt) => Promise<CadernoAttempt>
}

export const useNotebookStore = create<NotebookState>((set, get) => ({
  notebooks: loadNotebooksCache(),
  attempts: loadAttemptsCache(),
  loading: false,

  loadNotebooks: async (userId) => {
    set({ loading: true })
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('question_notebooks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (error) throw error
        const notebooks: Caderno[] = (data ?? []).map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          title: r.title,
          filters: r.filters ?? {},
          questionIds: r.question_ids ?? [],
          createdAt: r.created_at ?? '',
        }))
        const others = get().notebooks.filter(n => n.userId !== userId)
        const merged = [...others, ...notebooks]
        saveNotebooksCache(merged)
        set({ notebooks: merged })
      }
    } catch (err) {
      console.error('Erro ao carregar cadernos:', err)
    } finally {
      set({ loading: false })
    }
  },

  createNotebook: async ({ userId, title, filters, questionIds }) => {
    const notebook: Caderno = {
      id: generateId(),
      userId,
      title,
      filters,
      questionIds,
      createdAt: new Date().toISOString(),
    }
    const notebooks = [notebook, ...get().notebooks]
    saveNotebooksCache(notebooks)
    set({ notebooks })

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('question_notebooks').insert({
        id: notebook.id,
        user_id: notebook.userId,
        title: notebook.title,
        filters: notebook.filters,
        question_ids: notebook.questionIds,
        created_at: notebook.createdAt,
      })
      if (error) console.error('Erro ao salvar caderno no Supabase:', error)
    }

    return notebook
  },

  deleteNotebook: async (id) => {
    const notebooks = get().notebooks.filter(n => n.id !== id)
    const attempts = get().attempts.filter(a => a.notebookId !== id)
    saveNotebooksCache(notebooks)
    saveAttemptsCache(attempts)
    set({ notebooks, attempts })

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('question_notebooks').delete().eq('id', id)
      if (error) console.error('Erro ao excluir caderno no Supabase:', error)
      const { error: attemptsError } = await supabase.from('notebook_attempts').delete().eq('notebook_id', id)
      if (attemptsError) console.error('Erro ao excluir progresso do caderno no Supabase:', attemptsError)
    }
  },

  getNotebook: (id) => get().notebooks.find(n => n.id === id),

  loadAttempt: async (notebookId, userId) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('notebook_attempts')
        .select('*')
        .eq('notebook_id', notebookId)
        .eq('user_id', userId)
        .maybeSingle()
      if (!error && data) {
        const attempt: CadernoAttempt = {
          id: data.id,
          notebookId: data.notebook_id,
          userId: data.user_id,
          answers: data.answers ?? {},
          currentIndex: data.current_index ?? 0,
          startedAt: data.started_at ?? new Date().toISOString(),
          finishedAt: data.finished_at ?? undefined,
          timeSpentSeconds: data.time_spent_seconds ?? 0,
        }
        const attempts = [...get().attempts.filter(a => a.id !== attempt.id), attempt]
        saveAttemptsCache(attempts)
        set({ attempts })
        return attempt
      }
    }
    return get().getAttempt(notebookId, userId)
  },

  getAttempt: (notebookId, userId) =>
    get().attempts.find(a => a.notebookId === notebookId && a.userId === userId),

  startAttempt: (notebookId, userId) => {
    const existing = get().getAttempt(notebookId, userId)
    if (existing) return existing
    const attempt: CadernoAttempt = {
      id: generateId(),
      notebookId,
      userId,
      answers: {},
      currentIndex: 0,
      startedAt: new Date().toISOString(),
      timeSpentSeconds: 0,
    }
    const attempts = [...get().attempts, attempt]
    saveAttemptsCache(attempts)
    set({ attempts })
    scheduleAttemptWrite(attempt)
    return attempt
  },

  saveAttemptProgress: (attempt) => {
    const attempts = [...get().attempts.filter(a => a.id !== attempt.id), attempt]
    saveAttemptsCache(attempts)
    set({ attempts })
    scheduleAttemptWrite(attempt)
  },

  finishAttempt: async (attempt) => {
    const finished: CadernoAttempt = { ...attempt, finishedAt: new Date().toISOString() }
    const attempts = [...get().attempts.filter(a => a.id !== finished.id), finished]
    saveAttemptsCache(attempts)
    set({ attempts })

    const pending = pendingAttemptWrites.get(finished.id)
    if (pending) {
      clearTimeout(pending)
      pendingAttemptWrites.delete(finished.id)
    }
    upsertAttemptRow(finished)
  },

  // Zera a tentativa para o aluno refazer o caderno do zero (mantém o mesmo
  // registro, apenas limpa respostas/tempo e remove o finishedAt).
  restartAttempt: async (attempt) => {
    const reset: CadernoAttempt = {
      ...attempt,
      answers: {},
      currentIndex: 0,
      startedAt: new Date().toISOString(),
      finishedAt: undefined,
      timeSpentSeconds: 0,
    }
    const attempts = [...get().attempts.filter(a => a.id !== reset.id), reset]
    saveAttemptsCache(attempts)
    set({ attempts })

    const pending = pendingAttemptWrites.get(reset.id)
    if (pending) {
      clearTimeout(pending)
      pendingAttemptWrites.delete(reset.id)
    }
    upsertAttemptRow(reset)
    return reset
  },
}))
