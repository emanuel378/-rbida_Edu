import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { isValidCPF } from '../_shared/cpf.ts'

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

function tomorrowDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  if (!ASAAS_API_KEY) {
    return jsonResponse({ error: 'Asaas não configurado no servidor (ASAAS_API_KEY ausente)' }, 500)
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Supabase não configurado no servidor (SUPABASE_SERVICE_ROLE_KEY ausente)' }, 500)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return jsonResponse({ error: 'Não autenticado' }, 401)
  }

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData?.user) {
    return jsonResponse({ error: 'Sessão inválida ou expirada' }, 401)
  }
  const userId = authData.user.id
  const email = authData.user.email ?? ''

  let body: { courseId?: string; name?: string; cpf?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido' }, 400)
  }

  // userId e email vêm do token validado acima, nunca do body: o cliente não
  // pode mais gerar cobrança em nome de outro usuário.
  const { courseId, name } = body
  const cpf = (body.cpf ?? '').replace(/\D/g, '')

  if (!courseId || !name || !email) {
    return jsonResponse({ error: 'courseId, name e email (do usuário autenticado) são obrigatórios' }, 400)
  }
  if (!isValidCPF(cpf)) {
    return jsonResponse({ error: 'CPF inválido' }, 400)
  }

  const { data: course, error: courseError } = await admin
    .from('courses')
    .select('id, title, price, status')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    return jsonResponse({ error: 'Curso não encontrado' }, 404)
  }
  if (course.status !== 'approved') {
    return jsonResponse({ error: 'Curso ainda não está disponível para compra' }, 400)
  }
  if (!course.price || course.price <= 0) {
    return jsonResponse({ error: 'Este curso é gratuito, matricule-se diretamente' }, 400)
  }

  const { data: existingEnrollment } = await admin
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (existingEnrollment) {
    return jsonResponse({ error: 'Você já está matriculado neste curso' }, 409)
  }

  // Reaproveita um pedido Pix ainda válido em vez de gerar cobranças duplicadas no Asaas
  const { data: existingOrder } = await admin
    .from('orders')
    .select('id, amount, asaas_payment_id, pix_qr_code, pix_payload, pix_expires_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'pending')
    .gt('pix_expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingOrder) {
    return jsonResponse({
      orderId: existingOrder.id,
      amount: existingOrder.amount,
      qrCodeImage: `data:image/png;base64,${existingOrder.pix_qr_code}`,
      payload: existingOrder.pix_payload,
      expiresAt: existingOrder.pix_expires_at,
    })
  }

  // Salva o CPF no perfil pra próxima compra (melhor esforço; não bloqueia o fluxo)
  admin.from('profiles').update({ cpf }).eq('id', userId).then(() => {})

  try {
    let customerId: string
    const existingCustomers = await asaasFetch(`/customers?cpfCnpj=${cpf}`)
    if (existingCustomers?.data?.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const created = await asaasFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({ name, email, cpfCnpj: cpf, externalReference: userId }),
      })
      customerId = created.id
    }

    const orderId = crypto.randomUUID()

    const payment = await asaasFetch('/payments', {
      method: 'POST',
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: course.price,
        dueDate: tomorrowDate(),
        description: `Acesso ao curso: ${course.title}`,
        externalReference: orderId,
      }),
    })

    const pixData = await asaasFetch(`/payments/${payment.id}/pixQrCode`)

    const { error: insertError } = await admin.from('orders').insert({
      id: orderId,
      user_id: userId,
      course_id: courseId,
      amount: course.price,
      status: 'pending',
      asaas_customer_id: customerId,
      asaas_payment_id: payment.id,
      pix_qr_code: pixData.encodedImage,
      pix_payload: pixData.payload,
      pix_expires_at: pixData.expirationDate,
    })

    if (insertError) {
      return jsonResponse({ error: `Falha ao salvar pedido: ${insertError.message}` }, 500)
    }

    return jsonResponse({
      orderId,
      amount: course.price,
      qrCodeImage: `data:image/png;base64,${pixData.encodedImage}`,
      payload: pixData.payload,
      expiresAt: pixData.expirationDate,
    })
  } catch (err) {
    return jsonResponse({ error: `Falha ao criar cobrança Pix no Asaas: ${(err as Error).message}` }, 502)
  }
})
