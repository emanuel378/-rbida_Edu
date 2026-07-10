import { create } from 'zustand'
import {
  fetchQuestions,
  addQuestion as addToSupabase,
  updateQuestion as updateInSupabase,
  deleteQuestion as deleteFromSupabase,
  generateQuestionCode,
} from './questionsService'
import type { Question, Comment, SimuladoResult, QuestionStats, QuestionAnswerRecord, Message } from './mock'
import { mockQuestionStats } from './mock'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import { generateId } from '../../../lib/id'

const STATS_KEY = 'question_stats'
const HISTORY_KEY = 'answer_history'
const DELETED_KEY = 'deleted_questions'

const loadStats = (): QuestionStats[] => {
  const saved = localStorage.getItem(STATS_KEY)
  if (!saved) {
    localStorage.setItem(STATS_KEY, JSON.stringify(mockQuestionStats))
    return mockQuestionStats
  }
  return JSON.parse(saved)
}

const saveStats = (stats: QuestionStats[]) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

const ensureCode = (q: Question): Question => {
  if (!q.code) return { ...q, code: generateQuestionCode() }
  return q
}

interface QuestionState {
  questions: Question[]
  deletedQuestions: Question[]
  comments: Comment[]
  results: SimuladoResult[]
  questionStats: QuestionStats[]
  answerHistory: QuestionAnswerRecord[]
  loading: boolean
  addQuestion: (question: Question) => Promise<void>
  deleteQuestion: (questionId: string) => Promise<void>
  updateQuestion: (question: Question) => Promise<void>
  loadQuestions: () => Promise<void>
  addComment: (comment: Comment) => void
  getComments: (lessonId: string) => Comment[]
  getQuestionComments: (questionId: string) => Comment[]
  reportQuestionError: (questionId: string, userId: string, userName: string, reason: string) => void
  addResult: (result: SimuladoResult) => void
  getResults: () => SimuladoResult[]
  getQuestionStats: (questionId: string) => QuestionStats | undefined
  recordAnswer: (record: QuestionAnswerRecord) => void
  getAnswerHistory: (userId?: string) => QuestionAnswerRecord[]
  requestQuestionDeletion: (questionId: string, userId: string, userName: string) => void
  approveQuestionDeletion: (questionId: string, messageId: string) => Promise<void>
}

export const useQuestionStore = create<QuestionState>((set, get) => ({
  questions: [],
  deletedQuestions: JSON.parse(localStorage.getItem(DELETED_KEY) ?? '[]'),
  comments: JSON.parse(localStorage.getItem('comments') ?? '[]'),
  results: JSON.parse(localStorage.getItem('results') ?? '[]'),
  questionStats: loadStats(),
  answerHistory: JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'),
  loading: false,

  loadQuestions: async () => {
    set({ loading: true })
    try {
      const data = await fetchQuestions()
      set({ questions: data.map(ensureCode) })
    } catch (err) {
      console.error('Erro ao carregar questões do Supabase:', err)
    } finally {
      set({ loading: false })
    }
  },

  addQuestion: async (question) => {
    const q = ensureCode(question)
    await addToSupabase(q)
    set(state => ({ questions: [q, ...state.questions] }))
  },

  deleteQuestion: async (questionId) => {
    await deleteFromSupabase(questionId)
    set(state => ({
      questions: state.questions.filter(q => q.id !== questionId),
    }))
  },

  updateQuestion: async (question) => {
    const q = ensureCode(question)
    await updateInSupabase(q)
    set(state => ({
      questions: state.questions.map(item => item.id === q.id ? q : item),
    }))
  },

  addComment: (comment) => {
    const comments = [...get().comments, comment]
    localStorage.setItem('comments', JSON.stringify(comments))
    set({ comments })
  },

  getComments: (lessonId) =>
    get().comments.filter(c => c.lessonId === lessonId),

  getQuestionComments: (questionId) =>
    get().comments.filter(c => c.questionId === questionId),

  reportQuestionError: (questionId, userId, userName, reason) => {
    const question = get().questions.find(q => q.id === questionId)
    if (!question) return

    const admin = JSON.parse(localStorage.getItem('users') ?? '[]').find((u: any) => u.role === 'admin')

    const msg: Message = {
      id: generateId(),
      courseId: 'questions_bank',
      fromUserId: userId,
      fromUserName: userName,
      toTeacherId: admin?.id || 'admin',
      text: reason,
      createdAt: new Date().toISOString(),
      type: 'question_report',
      status: 'pending',
      targetType: 'question',
      targetName: `Questão #${question.code || question.id}`,
    }

    const messages = JSON.parse(localStorage.getItem('messages') ?? '[]')
    messages.push(msg)
    localStorage.setItem('messages', JSON.stringify(messages))

    if (isSupabaseConfigured()) {
      supabase.from('messages').insert({
        id: msg.id,
        course_id: msg.courseId,
        from_user_id: msg.fromUserId,
        from_user_name: msg.fromUserName,
        to_teacher_id: msg.toTeacherId,
        text: msg.text,
        created_at: msg.createdAt,
        type: msg.type,
        status: msg.status,
        target_type: msg.targetType,
        target_name: msg.targetName,
      }).then(({ error }) => { if (error) console.error('Erro ao enviar relato:', error) })
    }
  },

  addResult: (result) => {
    const results = [...get().results, result]
    localStorage.setItem('results', JSON.stringify(results))
    set({ results })
  },

  getResults: () =>
    get().results.sort((a, b) => b.score - a.score),

  getQuestionStats: (questionId) =>
    get().questionStats.find(s => s.questionId === questionId),

  recordAnswer: (record) => {
    const history = get().answerHistory
    const prev = history.find(r => r.questionId === record.questionId && r.userId === record.userId)

    const stats = [...get().questionStats]
    let qStat = stats.find(s => s.questionId === record.questionId)
    if (!qStat) {
      qStat = { questionId: record.questionId, answers: {}, total: 0, correct: 0 }
      stats.push(qStat)
    }

    if (prev) {
      qStat.answers = {
        ...qStat.answers,
        [prev.selectedAnswer]: Math.max(0, (qStat.answers[prev.selectedAnswer] || 1) - 1),
      }
      if (prev.correct) qStat.correct -= 1
    } else {
      qStat.total += 1
    }

    qStat.answers = {
      ...qStat.answers,
      [record.selectedAnswer]: (qStat.answers[record.selectedAnswer] || 0) + 1,
    }
    if (record.correct) qStat.correct += 1
    saveStats(stats)
    set({ questionStats: stats })

    const updatedHistory = prev
      ? history.map(r => r.questionId === record.questionId && r.userId === record.userId ? record : r)
      : [...history, record]
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory))
    set({ answerHistory: updatedHistory })
  },

  getAnswerHistory: (userId) => {
    const all = get().answerHistory
    return userId ? all.filter(r => r.userId === userId) : all
  },

  requestQuestionDeletion: (questionId, userId, userName) => {
    const question = get().questions.find(q => q.id === questionId)
    if (!question) return

    const admin = JSON.parse(localStorage.getItem('users') ?? '[]').find((u: any) => u.role === 'admin')

    const msg: Message = {
      id: generateId(),
      courseId: 'questions_bank',
      fromUserId: userId,
      fromUserName: userName,
      toTeacherId: admin?.id || 'admin',
      text: `O professor ${userName} solicita a exclusão da questão: "${question.question.substring(0, 80)}${question.question.length > 80 ? '...' : ''}"`,
      createdAt: new Date().toISOString(),
      type: 'delete_request',
      status: 'pending',
      targetType: 'question',
      targetName: `Questão #${question.code || question.id}`,
    }

    const messages = JSON.parse(localStorage.getItem('messages') ?? '[]')
    messages.push(msg)
    localStorage.setItem('messages', JSON.stringify(messages))

    if (isSupabaseConfigured()) {
      supabase.from('messages').insert({
        id: msg.id,
        course_id: msg.courseId,
        from_user_id: msg.fromUserId,
        from_user_name: msg.fromUserName,
        to_teacher_id: msg.toTeacherId,
        text: msg.text,
        created_at: msg.createdAt,
        type: msg.type,
        status: msg.status,
        target_type: msg.targetType,
        target_name: msg.targetName,
      }).then(({ error }) => { if (error) console.error('Erro ao salvar solicitação:', error) })
    }

    set(state => ({
      questions: state.questions.map(q =>
        q.id === questionId ? { ...q, _pendingDeletion: true } as Question : q
      ),
    }))

    alert('Solicitação de exclusão enviada para o administrador.')
  },

  approveQuestionDeletion: async (questionId, messageId) => {
    const question = get().questions.find(q => q.id === questionId)
    if (!question) return

    const deletedQuestions = [...get().deletedQuestions, question]
    localStorage.setItem(DELETED_KEY, JSON.stringify(deletedQuestions))

    if (isSupabaseConfigured()) {
      await supabase.from('deleted_questions').insert({
        id: question.id,
        code: question.code,
        question: question.question,
        options: question.options,
        correct_answer: question.correctAnswer,
        module_id: question.moduleId,
        topic_id: question.topicId,
        assunto: question.assunto,
        banca: question.banca,
        nivel: question.nivel,
        ano: question.ano,
        gabarito_comentado: question.gabaritoComentado,
        material_url: question.materialUrl,
        material_type: question.materialType,
        aulas_relacionadas: question.aulaRelacionada ? [question.aulaRelacionada] : [],
        deleted_at: new Date().toISOString(),
        deleted_by: 'admin',
      }).then(({ error }) => { if (error) console.error('Erro ao salvar questão deletada:', error) })

      await deleteFromSupabase(questionId)
    }

    const messages = JSON.parse(localStorage.getItem('messages') ?? '[]')
    const updatedMessages = messages.map((m: Message) =>
      m.id === messageId ? { ...m, status: 'approved' as const, resolvedAt: new Date().toISOString() } : m
    )
    localStorage.setItem('messages', JSON.stringify(updatedMessages))

    if (isSupabaseConfigured()) {
      supabase.from('messages').update({ status: 'approved', resolved_at: new Date().toISOString() }).eq('id', messageId)
        .then(({ error }) => { if (error) console.error(error) })
    }

    set({
      questions: get().questions.filter(q => q.id !== questionId),
      deletedQuestions,
    })
  },
}))