import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'
import { encodeBase64 } from 'jsr:@std/encoding@1/base64'
import { corsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctAnswer: { type: 'integer' },
          assunto: { type: 'string' },
          banca: { type: 'string' },
          ano: { type: 'string' },
          nivel: { type: 'string' },
          gabaritoComentado: { type: 'string' },
        },
        required: ['question', 'options', 'correctAnswer', 'assunto', 'banca', 'ano', 'nivel', 'gabaritoComentado'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
}

const EXTRACTION_PROMPT = `Extraia todas as questões de múltipla escolha deste material e gere um JSON estruturado.
Para cada questão, identifique:
- o enunciado completo
- as alternativas, na ordem em que aparecem no material
- o índice (começando em 0) da alternativa correta
- o assunto abordado
- a banca organizadora, se identificável (senão deixe em branco)
- o ano, se identificável (senão deixe em branco)
- o nível ("Médio", "Superior" ou "Técnico"), se identificável (senão deixe em branco)
- um gabarito comentado explicando por que a alternativa correta está certa

Se o material já tiver gabarito ou comentários, use-os como base para o gabarito comentado.
Se não conseguir identificar com confiança a alternativa correta de alguma questão, ainda assim inclua a questão com sua melhor estimativa.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  if (!ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'IA não configurada no servidor (ANTHROPIC_API_KEY ausente)' }, 500)
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

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profileError || !profile || !['professor', 'admin'].includes(profile.role)) {
    return jsonResponse({ error: 'Usuário não autorizado a gerar questões' }, 403)
  }

  let body: { materialUrl?: string; mimeType?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido' }, 400)
  }

  const { materialUrl, mimeType } = body
  if (!materialUrl || !mimeType) {
    return jsonResponse({ error: 'materialUrl e mimeType são obrigatórios' }, 400)
  }

  const isPdf = mimeType === 'application/pdf'
  const isImage = mimeType.startsWith('image/')
  if (!isPdf && !isImage) {
    return jsonResponse({ error: 'Formato de arquivo não suportado. Envie PDF, JPG ou PNG.' }, 400)
  }

  const fileRes = await fetch(materialUrl)
  if (!fileRes.ok) {
    return jsonResponse({ error: 'Falha ao baixar o arquivo enviado' }, 502)
  }
  const arrayBuffer = await fileRes.arrayBuffer()
  const base64 = encodeBase64(arrayBuffer)

  const contentBlock = isPdf
    ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 } }
    : { type: 'image' as const, source: { type: 'base64' as const, media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 } }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { format: { type: 'json_schema', schema: QUESTION_SCHEMA } },
      messages: [{
        role: 'user',
        content: [contentBlock, { type: 'text', text: EXTRACTION_PROMPT }],
      }],
    } as Anthropic.Messages.MessageStreamParams)

    const finalMessage = await stream.finalMessage()

    if (finalMessage.stop_reason === 'refusal') {
      return jsonResponse({ error: 'A IA recusou processar este conteúdo.' }, 422)
    }

    const textBlock = finalMessage.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return jsonResponse({ error: 'A IA não retornou nenhum conteúdo de texto' }, 502)
    }

    const parsed = JSON.parse(textBlock.text)
    return jsonResponse({ questions: parsed.questions ?? [] })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Erro ao gerar questões com IA' }, 500)
  }
})
