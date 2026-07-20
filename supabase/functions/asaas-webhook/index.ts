import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const ASAAS_WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const PAID_EVENTS = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'])
const FAILED_EVENTS = new Set(['PAYMENT_OVERDUE', 'PAYMENT_DELETED', 'PAYMENT_REFUSED'])
const REFUNDED_EVENTS = new Set(['PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED'])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  if (!ASAAS_WEBHOOK_TOKEN) {
    return jsonResponse({ error: 'Webhook não configurado no servidor (ASAAS_WEBHOOK_TOKEN ausente)' }, 500)
  }

  // Token configurado no painel do Asaas (Configurações > Webhooks > Token de
  // autenticação), reenviado pelo Asaas no header abaixo em toda chamada.
  const receivedToken = req.headers.get('asaas-access-token')
  if (receivedToken !== ASAAS_WEBHOOK_TOKEN) {
    return jsonResponse({ error: 'Token inválido' }, 401)
  }

  let body: { event?: string; payment?: { id?: string; status?: string; externalReference?: string } }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido' }, 400)
  }

  const event = body.event ?? ''
  const payment = body.payment
  if (!payment?.id) {
    return jsonResponse({ ok: true, ignored: true })
  }

  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, course_id, status')
    .eq('asaas_payment_id', payment.id)
    .maybeSingle()

  if (!order) {
    // Pedido não encontrado (ex.: cobrança criada fora do fluxo do app) — só confirma o recebimento
    return jsonResponse({ ok: true, ignored: true })
  }

  if (PAID_EVENTS.has(event)) {
    if (order.status !== 'paid') {
      const { error: updateError } = await admin
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', order.id)
      if (updateError) console.error('Falha ao marcar order como paga:', updateError.message)
    }

    // Não depende de constraint UNIQUE(user_id, course_id) no banco: verifica
    // explicitamente antes de inserir, pra ser idempotente mesmo se o Asaas
    // reenviar o evento (retry) ou se o webhook rodar mais de uma vez.
    const { data: existingEnrollment } = await admin
      .from('enrollments')
      .select('id')
      .eq('user_id', order.user_id)
      .eq('course_id', order.course_id)
      .maybeSingle()

    if (!existingEnrollment) {
      const { error: enrollError } = await admin.from('enrollments').insert({
        id: crypto.randomUUID(),
        user_id: order.user_id,
        course_id: order.course_id,
        progress: 0,
        completed_lessons: [],
        created_at: new Date().toISOString(),
      })
      if (enrollError) console.error('Falha ao criar enrollment:', enrollError.message)
    }
  } else if (FAILED_EVENTS.has(event)) {
    if (order.status === 'pending') {
      await admin.from('orders').update({ status: 'failed' }).eq('id', order.id)
    }
  } else if (REFUNDED_EVENTS.has(event)) {
    await admin.from('orders').update({ status: 'refunded' }).eq('id', order.id)
  }

  return jsonResponse({ ok: true })
})
