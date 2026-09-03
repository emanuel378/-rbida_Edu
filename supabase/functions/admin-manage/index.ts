import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { ensureEnrollment } from '../_shared/enroll.ts'

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') ?? ''
const ASAAS_BASE_URL = (Deno.env.get('ASAAS_BASE_URL') ?? 'https://api-sandbox.asaas.com/v3').replace(/\/$/, '')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Mesmo helper de create-payment/index.ts
async function asaasFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
      ...(init?.headers ?? {}),
    },
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const message = data?.errors?.[0]?.description || text || `Asaas retornou ${res.status}`
    throw new Error(message)
  }
  return data
}

// Status do pagamento no Asaas -> status da nossa tabela orders
// (CHECK: 'pending' | 'paid' | 'expired' | 'failed' | 'refunded')
function mapAsaasStatus(asaasStatus: string): 'pending' | 'paid' | 'expired' | 'failed' | 'refunded' | null {
  switch (asaasStatus) {
    case 'CONFIRMED':
    case 'RECEIVED':
    case 'RECEIVED_IN_CASH':
    case 'DUNNING_RECEIVED':
      return 'paid'
    case 'OVERDUE':
      return 'expired'
    case 'REFUNDED':
    case 'REFUND_REQUESTED':
    case 'CHARGEBACK_REQUESTED':
    case 'CHARGEBACK_DISPUTE':
    case 'AWAITING_CHARGEBACK_REVERSAL':
      return 'refunded'
    case 'DELETED':
      return 'failed'
    case 'PENDING':
    case 'AWAITING_RISK_ANALYSIS':
      return 'pending'
    default:
      return null
  }
}

interface AuditEntry {
  adminId: string
  adminName: string | null
  action: string
  targetUserId?: string | null
  targetUserName?: string | null
  courseId?: string | null
  courseTitle?: string | null
  orderId?: string | null
  detail?: Record<string, unknown> | null
}

async function writeAudit(e: AuditEntry) {
  const { error } = await admin.from('admin_audit_log').insert({
    id: crypto.randomUUID(),
    admin_id: e.adminId,
    admin_name: e.adminName,
    action: e.action,
    target_user_id: e.targetUserId ?? null,
    target_user_name: e.targetUserName ?? null,
    course_id: e.courseId ?? null,
    course_title: e.courseTitle ?? null,
    order_id: e.orderId ?? null,
    detail: e.detail ?? null,
  })
  if (error) console.error('Falha ao gravar auditoria:', error.message)
}

// Reconcilia um pedido com o Asaas. Retorna o pedido atualizado + se mudou.
async function reconcileOrder(orderRow: {
  id: string
  status: string
  user_id: string
  course_id: string
  asaas_payment_id: string | null
}) {
  if (!orderRow.asaas_payment_id) {
    return { order: orderRow, changed: false, reason: 'Pedido sem cobrança no Asaas' }
  }
  const payment = await asaasFetch(`/payments/${orderRow.asaas_payment_id}`)
  const mapped = mapAsaasStatus(payment.status)
  if (!mapped || mapped === orderRow.status) {
    return { order: orderRow, changed: false, asaasStatus: payment.status }
  }

  const patch: Record<string, unknown> = { status: mapped }
  if (mapped === 'paid') patch.paid_at = payment.paymentDate ?? payment.clientPaymentDate ?? new Date().toISOString()

  const { data: updated, error } = await admin
    .from('orders')
    .update(patch)
    .eq('id', orderRow.id)
    .select('*')
    .single()
  if (error) throw new Error(`Falha ao atualizar pedido: ${error.message}`)

  if (mapped === 'paid') {
    await ensureEnrollment(admin, orderRow.user_id, orderRow.course_id)
  }

  return { order: updated, changed: true, asaasStatus: payment.status, previous: orderRow.status }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Supabase não configurado no servidor (SUPABASE_SERVICE_ROLE_KEY ausente)' }, 500)
  }

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return jsonResponse({ error: 'Não autenticado' }, 401)

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData?.user) {
    return jsonResponse({ error: 'Sessão inválida ou expirada' }, 401)
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, name, role')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    return jsonResponse({ error: 'Apenas administradores podem usar este painel' }, 403)
  }
  const adminId = profile.id as string
  const adminName = (profile.name as string) ?? null

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido' }, 400)
  }
  const action = String(body.action ?? '')

  try {
    // ----------------------------------------------------------
    // OVERVIEW — tudo que o painel precisa numa chamada só
    // ----------------------------------------------------------
    if (action === 'overview') {
      const [ordersRes, enrollmentsRes, profilesRes, coursesRes, auditRes] = await Promise.all([
        admin.from('orders').select('*').order('created_at', { ascending: false }).limit(500),
        admin.from('enrollments').select('*'),
        admin.from('profiles').select('id, name, email, cpf, role'),
        admin.from('courses').select('id, title, price, status, published, access_duration_days'),
        admin.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(200),
      ])

      for (const r of [ordersRes, enrollmentsRes, profilesRes, coursesRes]) {
        if (r.error) return jsonResponse({ error: `Falha ao carregar dados: ${r.error.message}` }, 500)
      }

      const profilesById = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]))
      const coursesById = new Map((coursesRes.data ?? []).map((c: any) => [c.id, c]))

      const orders = (ordersRes.data ?? []).map((o: any) => {
        const p = profilesById.get(o.user_id)
        const c = coursesById.get(o.course_id)
        return {
          ...o,
          user_name: p?.name ?? null,
          user_email: p?.email ?? null,
          user_cpf: p?.cpf ?? null,
          course_title: c?.title ?? null,
        }
      })

      const students = (profilesRes.data ?? []).filter((p: any) => p.role === 'aluno')

      return jsonResponse({
        orders,
        enrollments: enrollmentsRes.data ?? [],
        students,
        courses: coursesRes.data ?? [],
        audit: auditRes.data ?? [],
      })
    }

    // ----------------------------------------------------------
    // GRANT ACCESS — libera acesso a um curso sem pagamento
    // ----------------------------------------------------------
    if (action === 'grant_access') {
      const userId = String(body.userId ?? '')
      const courseId = String(body.courseId ?? '')
      const note = body.note ? String(body.note) : null
      const durationDays = body.durationDays == null ? null : Number(body.durationDays)
      if (!userId || !courseId) return jsonResponse({ error: 'userId e courseId são obrigatórios' }, 400)
      if (durationDays != null && (!Number.isFinite(durationDays) || durationDays <= 0)) {
        return jsonResponse({ error: 'durationDays deve ser um número positivo ou nulo (vitalício)' }, 400)
      }

      const { data: course } = await admin.from('courses').select('id, title').eq('id', courseId).maybeSingle()
      if (!course) return jsonResponse({ error: 'Curso não encontrado' }, 404)
      const { data: student } = await admin.from('profiles').select('id, name').eq('id', userId).maybeSingle()
      if (!student) return jsonResponse({ error: 'Aluno não encontrado' }, 404)

      const expiresAt = durationDays == null
        ? null
        : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()

      const { data: existing } = await admin
        .from('enrollments')
        .select('id, progress, completed_lessons')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle()

      if (existing) {
        const { error } = await admin
          .from('enrollments')
          .update({
            revoked_at: null,
            expires_at: expiresAt,
            source: 'admin_grant',
            granted_by: adminId,
            admin_note: note,
          })
          .eq('id', existing.id)
        if (error) return jsonResponse({ error: `Falha ao atualizar matrícula: ${error.message}` }, 500)
      } else {
        const { error } = await admin.from('enrollments').insert({
          id: crypto.randomUUID(),
          user_id: userId,
          course_id: courseId,
          progress: 0,
          completed_lessons: [],
          created_at: new Date().toISOString(),
          expires_at: expiresAt,
          revoked_at: null,
          source: 'admin_grant',
          granted_by: adminId,
          admin_note: note,
        })
        if (error) return jsonResponse({ error: `Falha ao criar matrícula: ${error.message}` }, 500)
      }

      await writeAudit({
        adminId, adminName, action: 'grant_access',
        targetUserId: userId, targetUserName: student.name,
        courseId, courseTitle: course.title,
        detail: { durationDays, expiresAt, note, renewed: !!existing },
      })
      return jsonResponse({ ok: true })
    }

    // ----------------------------------------------------------
    // REVOKE ACCESS — bloqueia mantendo o progresso
    // ----------------------------------------------------------
    if (action === 'revoke_access') {
      const userId = String(body.userId ?? '')
      const courseId = String(body.courseId ?? '')
      const note = body.note ? String(body.note) : null
      if (!userId || !courseId) return jsonResponse({ error: 'userId e courseId são obrigatórios' }, 400)

      const { data: existing } = await admin
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle()
      if (!existing) return jsonResponse({ error: 'Este aluno não tem matrícula neste curso' }, 404)

      const { error } = await admin
        .from('enrollments')
        .update({ revoked_at: new Date().toISOString(), granted_by: adminId, admin_note: note })
        .eq('id', existing.id)
      if (error) return jsonResponse({ error: `Falha ao bloquear acesso: ${error.message}` }, 500)

      const { data: course } = await admin.from('courses').select('title').eq('id', courseId).maybeSingle()
      const { data: student } = await admin.from('profiles').select('name').eq('id', userId).maybeSingle()
      await writeAudit({
        adminId, adminName, action: 'revoke_access',
        targetUserId: userId, targetUserName: student?.name ?? null,
        courseId, courseTitle: course?.title ?? null,
        detail: { note },
      })
      return jsonResponse({ ok: true })
    }

    // ----------------------------------------------------------
    // RESTORE ACCESS — reativa uma matrícula bloqueada
    // ----------------------------------------------------------
    if (action === 'restore_access') {
      const userId = String(body.userId ?? '')
      const courseId = String(body.courseId ?? '')
      if (!userId || !courseId) return jsonResponse({ error: 'userId e courseId são obrigatórios' }, 400)

      const { data: existing } = await admin
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle()
      if (!existing) return jsonResponse({ error: 'Matrícula não encontrada' }, 404)

      const { error } = await admin
        .from('enrollments')
        .update({ revoked_at: null, granted_by: adminId })
        .eq('id', existing.id)
      if (error) return jsonResponse({ error: `Falha ao reativar acesso: ${error.message}` }, 500)

      const { data: course } = await admin.from('courses').select('title').eq('id', courseId).maybeSingle()
      const { data: student } = await admin.from('profiles').select('name').eq('id', userId).maybeSingle()
      await writeAudit({
        adminId, adminName, action: 'restore_access',
        targetUserId: userId, targetUserName: student?.name ?? null,
        courseId, courseTitle: course?.title ?? null,
      })
      return jsonResponse({ ok: true })
    }

    // ----------------------------------------------------------
    // SYNC ORDER — reconcilia o status de UM pedido com o Asaas
    // ----------------------------------------------------------
    if (action === 'sync_order') {
      if (!ASAAS_API_KEY) return jsonResponse({ error: 'Asaas não configurado no servidor (ASAAS_API_KEY ausente)' }, 500)
      const orderId = String(body.orderId ?? '')
      if (!orderId) return jsonResponse({ error: 'orderId é obrigatório' }, 400)

      const { data: order } = await admin
        .from('orders')
        .select('id, status, user_id, course_id, asaas_payment_id')
        .eq('id', orderId)
        .maybeSingle()
      if (!order) return jsonResponse({ error: 'Pedido não encontrado' }, 404)

      const result = await reconcileOrder(order)
      if (result.changed) {
        await writeAudit({
          adminId, adminName, action: 'sync_order',
          targetUserId: order.user_id, courseId: order.course_id, orderId,
          detail: { previous: result.previous, asaasStatus: result.asaasStatus, newStatus: (result.order as any).status },
        })
      }
      return jsonResponse({
        changed: result.changed,
        order: result.order,
        asaasStatus: result.asaasStatus ?? null,
        reason: result.reason ?? null,
      })
    }

    // ----------------------------------------------------------
    // SYNC PENDING — reconcilia todos os pedidos pendentes (90 dias)
    // ----------------------------------------------------------
    if (action === 'sync_pending') {
      if (!ASAAS_API_KEY) return jsonResponse({ error: 'Asaas não configurado no servidor (ASAAS_API_KEY ausente)' }, 500)
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      const { data: pending, error } = await admin
        .from('orders')
        .select('id, status, user_id, course_id, asaas_payment_id')
        .eq('status', 'pending')
        .gt('created_at', since)
      if (error) return jsonResponse({ error: `Falha ao listar pendentes: ${error.message}` }, 500)

      let changed = 0
      const errors: string[] = []
      for (const order of pending ?? []) {
        try {
          const result = await reconcileOrder(order)
          if (result.changed) changed++
        } catch (err) {
          errors.push(`${order.id}: ${(err as Error).message}`)
        }
      }

      await writeAudit({
        adminId, adminName, action: 'sync_pending',
        detail: { checked: pending?.length ?? 0, changed, errors: errors.slice(0, 10) },
      })
      return jsonResponse({ checked: pending?.length ?? 0, changed, errors })
    }

    // ----------------------------------------------------------
    // MARK PAID MANUAL — força o pedido como pago e libera o acesso
    // ----------------------------------------------------------
    if (action === 'mark_paid_manual') {
      const orderId = String(body.orderId ?? '')
      const note = body.note ? String(body.note) : null
      if (!orderId) return jsonResponse({ error: 'orderId é obrigatório' }, 400)

      const { data: order } = await admin
        .from('orders')
        .select('id, status, user_id, course_id')
        .eq('id', orderId)
        .maybeSingle()
      if (!order) return jsonResponse({ error: 'Pedido não encontrado' }, 404)

      const { error } = await admin
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', orderId)
      if (error) return jsonResponse({ error: `Falha ao marcar como pago: ${error.message}` }, 500)

      await ensureEnrollment(admin, order.user_id, order.course_id)

      const { data: course } = await admin.from('courses').select('title').eq('id', order.course_id).maybeSingle()
      const { data: student } = await admin.from('profiles').select('name').eq('id', order.user_id).maybeSingle()
      await writeAudit({
        adminId, adminName, action: 'mark_paid_manual',
        targetUserId: order.user_id, targetUserName: student?.name ?? null,
        courseId: order.course_id, courseTitle: course?.title ?? null, orderId,
        detail: { previous: order.status, note },
      })
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400)
  } catch (err) {
    return jsonResponse({ error: (err as Error).message || 'Erro inesperado no painel do admin' }, 500)
  }
})
