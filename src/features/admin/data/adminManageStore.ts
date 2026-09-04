import { create } from 'zustand'
import { invokeWithAuth } from '../../../lib/edgeFn'

export interface AdminOrder {
  id: string
  user_id: string
  course_id: string
  amount: number
  gross_amount: number | null
  status: 'pending' | 'paid' | 'expired' | 'failed' | 'refunded'
  payment_method: 'pix' | 'credit_card' | 'boleto'
  installment_count: number | null
  card_brand: string | null
  card_last_digits: string | null
  asaas_payment_id: string | null
  pix_expires_at: string | null
  boleto_url: string | null
  boleto_due_date: string | null
  created_at: string
  paid_at: string | null
  user_name: string | null
  user_email: string | null
  user_cpf: string | null
  course_title: string | null
}

export interface AdminEnrollment {
  id: string
  user_id: string
  course_id: string
  progress: number
  completed_lessons: string[]
  created_at: string
  expires_at: string | null
  revoked_at: string | null
  source: string | null
  granted_by: string | null
  admin_note: string | null
}

export interface AdminStudent {
  id: string
  name: string
  email: string
  cpf: string | null
}

export interface AdminCourseLite {
  id: string
  title: string
  price: number
  status: string
  published: boolean
  access_duration_days: number | null
}

export interface AdminAuditRow {
  id: string
  admin_id: string
  admin_name: string | null
  action: string
  target_user_id: string | null
  target_user_name: string | null
  course_id: string | null
  course_title: string | null
  order_id: string | null
  detail: Record<string, unknown> | null
  created_at: string
}

interface Overview {
  orders: AdminOrder[]
  enrollments: AdminEnrollment[]
  students: AdminStudent[]
  courses: AdminCourseLite[]
  audit: AdminAuditRow[]
}

interface AdminManageState extends Overview {
  loading: boolean
  acting: boolean
  error: string | null
  lastLoadedAt: number | null
  loadOverview: () => Promise<void>
  grantAccess: (userId: string, courseId: string, durationDays: number | null, note?: string) => Promise<void>
  revokeAccess: (userId: string, courseId: string, note?: string) => Promise<void>
  restoreAccess: (userId: string, courseId: string) => Promise<void>
  syncOrder: (orderId: string) => Promise<void>
  syncPending: () => Promise<{ checked: number; changed: number; errors: string[] }>
  markPaidManual: (orderId: string, note?: string) => Promise<void>
  deleteOrder: (orderId: string) => Promise<void>
  deleteEnrollment: (userId: string, courseId: string) => Promise<void>
  setCourseDuration: (courseId: string, days: number | null, applyToActive: boolean) => Promise<void>
  setEnrollmentExpiry: (userId: string, courseId: string, expiresAt: string | null, note?: string) => Promise<void>
}

export const useAdminManageStore = create<AdminManageState>((set, get) => {
  const runAction = async (action: string, payload: Record<string, unknown>) => {
    set({ acting: true, error: null })
    try {
      const res = await invokeWithAuth<Record<string, unknown>>('admin-manage', { action, ...payload })
      await get().loadOverview()
      return res
    } catch (err) {
      set({ error: (err as Error).message })
      throw err
    } finally {
      set({ acting: false })
    }
  }

  return {
    orders: [],
    enrollments: [],
    students: [],
    courses: [],
    audit: [],
    loading: false,
    acting: false,
    error: null,
    lastLoadedAt: null,

    loadOverview: async () => {
      set({ loading: true, error: null })
      try {
        const data = await invokeWithAuth<Overview>('admin-manage', { action: 'overview' })
        set({
          orders: data.orders ?? [],
          enrollments: data.enrollments ?? [],
          students: data.students ?? [],
          courses: data.courses ?? [],
          audit: data.audit ?? [],
          lastLoadedAt: Date.now(),
        })
      } catch (err) {
        set({ error: (err as Error).message })
      } finally {
        set({ loading: false })
      }
    },

    grantAccess: async (userId, courseId, durationDays, note) => {
      await runAction('grant_access', { userId, courseId, durationDays, note })
    },
    revokeAccess: async (userId, courseId, note) => {
      await runAction('revoke_access', { userId, courseId, note })
    },
    restoreAccess: async (userId, courseId) => {
      await runAction('restore_access', { userId, courseId })
    },
    syncOrder: async (orderId) => {
      await runAction('sync_order', { orderId })
    },
    syncPending: async () => {
      const res = await runAction('sync_pending', {})
      return res as { checked: number; changed: number; errors: string[] }
    },
    markPaidManual: async (orderId, note) => {
      await runAction('mark_paid_manual', { orderId, note })
    },
    deleteOrder: async (orderId) => {
      await runAction('delete_order', { orderId })
    },
    deleteEnrollment: async (userId, courseId) => {
      await runAction('delete_enrollment', { userId, courseId })
    },
    setCourseDuration: async (courseId, days, applyToActive) => {
      await runAction('set_course_duration', { courseId, days, applyToActive })
    },
    setEnrollmentExpiry: async (userId, courseId, expiresAt, note) => {
      await runAction('set_enrollment_expiry', { userId, courseId, expiresAt, note })
    },
  }
})
