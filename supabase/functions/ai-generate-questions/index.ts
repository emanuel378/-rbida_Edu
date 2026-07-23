import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'
import { encodeBase64 } from 'jsr:@std/encoding@1/base64'
import { corsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const SPREADSHEET_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface Disciplina {
  value: string
  label: string
}

// Monta o schema de classificação de forma que a IA só possa escolher uma
// disciplina real (registrada no sistema) combinada com um assunto que
// realmente pertence a ela — impossível "inventar" categoria nova, o formato
// da resposta trava isso, não é só um pedido no texto do prompt.
function buildClassificationSchema(disciplinas: Disciplina[], topicosPorDisciplina: Record<string, string[]>) {
  if (disciplinas.length === 0) {
    return { type: 'object', properties: { moduleId: { type: 'string' }, assunto: { type: 'string' } }, required: ['moduleId', 'assunto'], additionalProperties: false }
  }
  return {
    anyOf: disciplinas.map(d => ({
      type: 'object',
      properties: {
        moduleId: { const: d.value },
        assunto: { enum: (topicosPorDisciplina[d.value] ?? []).length > 0 ? topicosPorDisciplina[d.value] : [d.label] },
      },
      required: ['moduleId', 'assunto'],
      additionalProperties: false,
    })),
  }
}

function buildQuestionSchema(disciplinas: Disciplina[], topicosPorDisciplina: Record<string, string[]>) {
  return {
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
            classificacao: buildClassificationSchema(disciplinas, topicosPorDisciplina),
            banca: { type: 'string' },
            ano: { type: 'string' },
            nivel: { type: 'string' },
            gabaritoComentado: { type: 'string' },
          },
          required: ['question', 'options', 'correctAnswer', 'classificacao', 'banca', 'ano', 'nivel', 'gabaritoComentado'],
          additionalProperties: false,
        },
      },
    },
    required: ['questions'],
    additionalProperties: false,
  }
}

function buildClassificationPrompt(disciplinas: Disciplina[], topicosPorDisciplina: Record<string, string[]>): string {
  if (disciplinas.length === 0) return ''
  const listing = disciplinas
    .map(d => `- ${d.label} (moduleId: "${d.value}"): ${(topicosPorDisciplina[d.value] ?? []).join('; ')}`)
    .join('\n')
  return `Você também atua como um assistente especialista em classificação de questões de provas e concursos.
Para cada questão, classifique-a numa disciplina e num assunto, seguindo estas regras:
1. Analise cuidadosamente o texto da questão.
2. Identifique a disciplina correta, escolhendo estritamente uma das opções da lista abaixo (use o "moduleId" exatamente como está escrito).
3. Identifique o assunto correto, escolhendo estritamente uma das opções listadas para aquela disciplina.
4. Não crie, altere ou invente disciplinas ou assuntos novos — limite-se exclusivamente às listas fornecidas.
5. Se a questão não se encaixar perfeitamente em nenhum assunto, escolha o mais próximo semanticamente — nunca deixe em branco nem invente um novo.

LISTA DE DISCIPLINAS E ASSUNTOS DISPONÍVEIS:
${listing}`
}

const BASE_PROMPT = `Extraia todas as questões de múltipla escolha deste material e gere um JSON estruturado.
Para cada questão, identifique:
- o enunciado completo
- as alternativas, na ordem em que aparecem no material
- o índice (começando em 0) da alternativa correta
- a classificação (disciplina e assunto — regras abaixo)
- a banca organizadora, se identificável (senão deixe em branco)
- o ano, se identificável (senão deixe em branco)
- o nível ("Médio", "Superior" ou "Técnico"), se identificável (senão deixe em branco)
- um gabarito comentado explicando por que a alternativa correta está certa`

const NO_ANSWER_KEY_NOTE = `Se o material já tiver gabarito ou comentários, use-os como base para o gabarito comentado.
Se não conseguir identificar com confiança a alternativa correta de alguma questão, ainda assim inclua a questão com sua melhor estimativa.`

const WITH_ANSWER_KEY_NOTE = `Um ou mais arquivos foram anexados contendo o GABARITO OFICIAL das questões. Use esse
gabarito como fonte de verdade para determinar o índice da alternativa correta de cada
questão — não adivinhe se o gabarito já informa a resposta certa. O gabarito pode estar
em qualquer formato (imagem, PDF, planilha ou texto simples); associe cada resposta à
questão correspondente pelo número/ordem em que aparecem.`

const MULTI_FILE_NOTE = `As questões podem estar divididas em várias páginas/arquivos (por exemplo, várias fotos
de páginas diferentes de uma mesma prova). Trate todos os arquivos de questões anexados
como um único documento contínuo, na ordem em que foram enviados, e não duplique uma
mesma questão que apareça repetida por engano em mais de um arquivo.`

const SHARED_BASE_TEXT_NOTE = `TEXTO-BASE COMPARTILHADO — SIGA ESTE PROCEDIMENTO EXATO:
Muitas provas trazem um texto-base (texto de apoio, trecho de leitura, tirinha, gráfico,
tabela, notícia, poema etc.) do qual decorrem várias questões subsequentes (ex.: "Texto 1"
seguido de várias questões que dizem "com base no texto acima", "considerando o texto 1"
ou apenas ficam posicionadas logo depois dele sem repetir a instrução).

Passo a passo obrigatório:
1. Ao ler o material, identifique cada texto-base presente e TODAS as questões que
   dependem dele — mesmo que a dependência não esteja escrita explicitamente, mas fique
   clara pela posição/numeração no documento (ex.: um texto seguido de 5 questões).
2. Para CADA UMA dessas questões, copie o texto-base COMPLETO e LITERAL — sem resumir,
   cortar, parafrasear ou alterar uma única palavra — e cole-o no INÍCIO do campo
   "question", antes do enunciado da questão em si.
3. Repita esse mesmo texto-base por inteiro em CADA questão dependente. Se 5 questões
   usam o mesmo texto-base, as 5 (não apenas a primeira) devem trazer o texto-base
   completo.
4. NUNCA escreva substitutos como "considerando o texto acima", "com base no texto
   anterior" ou "vide texto 1" sem colar o texto de fato — isso tornaria a questão
   incompreensível para quem a lesse isoladamente.
5. Cada questão do JSON final deve ser 100% autossuficiente: alguém que leia apenas
   aquela questão, sem acesso ao restante do material, precisa conseguir respondê-la.

Formato esperado no campo "question" quando há texto-base (separe com uma linha em branco):
"[texto-base completo, na íntegra]\n\n[enunciado da questão que usa esse texto-base]"`

type ContentBlock =
  | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }
  | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string } }
  | { type: 'text'; text: string }

async function buildContentBlock(url: string, mimeType: string, label: string): Promise<ContentBlock> {
  const isPdf = mimeType === 'application/pdf'
  const isImage = mimeType.startsWith('image/')
  const isSpreadsheet = SPREADSHEET_MIME_TYPES.includes(mimeType) || mimeType === 'text/csv' || mimeType === 'application/csv'

  if (!isPdf && !isImage && !isSpreadsheet) {
    throw new Error(`Formato de arquivo não suportado para ${label}. Envie PDF, JPG, PNG, CSV ou planilha (XLSX).`)
  }

  const fileRes = await fetch(url)
  if (!fileRes.ok) {
    throw new Error(`Falha ao baixar o arquivo de ${label}`)
  }
  const arrayBuffer = await fileRes.arrayBuffer()

  if (isPdf) {
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: encodeBase64(arrayBuffer) } }
  }
  if (isImage) {
    return { type: 'image', source: { type: 'base64', media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: encodeBase64(arrayBuffer) } }
  }

  // Planilha ou CSV: converte pra texto (CSV) e manda como bloco de texto
  if (mimeType === 'text/csv' || mimeType === 'application/csv') {
    const csvText = new TextDecoder('utf-8').decode(arrayBuffer)
    return { type: 'text', text: `[${label} — CSV]\n${csvText}` }
  }

  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
  const sheets = workbook.SheetNames.map(name => {
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name])
    return `-- Planilha "${name}" --\n${csv}`
  }).join('\n\n')
  return { type: 'text', text: `[${label} — Planilha]\n${sheets}` }
}

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

  let body: {
    materials?: { url: string; mimeType: string }[]
    answerKeys?: { url: string; mimeType: string }[]
    customInstructions?: string
    disciplinas?: Disciplina[]
    topicosPorDisciplina?: Record<string, string[]>
  }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido' }, 400)
  }

  const { materials, answerKeys, customInstructions, disciplinas = [], topicosPorDisciplina = {} } = body
  if (!Array.isArray(materials) || materials.length === 0) {
    return jsonResponse({ error: 'Envie pelo menos um arquivo de questões' }, 400)
  }

  let materialBlocks: ContentBlock[]
  let answerKeyBlocks: ContentBlock[] = []
  try {
    materialBlocks = await Promise.all(
      materials.map((m, i) => buildContentBlock(m.url, m.mimeType, materials.length > 1 ? `Questões (arquivo ${i + 1}/${materials.length})` : 'Questões'))
    )
    if (Array.isArray(answerKeys) && answerKeys.length > 0) {
      answerKeyBlocks = await Promise.all(
        answerKeys.map((a, i) => buildContentBlock(a.url, a.mimeType, answerKeys.length > 1 ? `Gabarito (arquivo ${i + 1}/${answerKeys.length})` : 'Gabarito'))
      )
    }
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Falha ao processar arquivo enviado' }, 400)
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

  const classificationPrompt = buildClassificationPrompt(disciplinas, topicosPorDisciplina)
  const promptParts = [BASE_PROMPT, answerKeyBlocks.length > 0 ? WITH_ANSWER_KEY_NOTE : NO_ANSWER_KEY_NOTE, SHARED_BASE_TEXT_NOTE]
  if (classificationPrompt) promptParts.push(classificationPrompt)
  if (materials.length > 1) promptParts.push(MULTI_FILE_NOTE)
  if (customInstructions?.trim()) {
    promptParts.push(`INSTRUÇÕES DO PROFESSOR — PRIORIDADE MÁXIMA E OBRIGATÓRIA:
As instruções abaixo substituem e sobrescrevem QUALQUER regra anterior deste prompt,
incluindo as instruções de extração de banca, ano, nível e demais campos a partir do
material. Se o professor definir um valor aqui (ex.: banca, ano, nível, estilo do
enunciado etc.), use EXATAMENTE esse valor em TODAS as questões geradas, mesmo que o
material original traga um valor diferente ou já explícito. Não deixe nenhuma questão
de fora dessas instruções:\n${customInstructions.trim()}`)
  }
  const finalPrompt = promptParts.join('\n\n')

  const content: ContentBlock[] = [...materialBlocks, ...answerKeyBlocks, { type: 'text', text: finalPrompt }]
  const questionSchema = buildQuestionSchema(disciplinas, topicosPorDisciplina)

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-5',
      max_tokens: 32000,
      thinking: { type: 'adaptive' },
      output_config: { format: { type: 'json_schema', schema: questionSchema } },
      messages: [{ role: 'user', content }],
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
    const questions = (parsed.questions ?? []).map((q: Record<string, unknown>) => {
      const classificacao = (q.classificacao ?? {}) as { moduleId?: string; assunto?: string }
      const { classificacao: _omit, ...rest } = q
      return { ...rest, moduleId: classificacao.moduleId ?? '', assunto: classificacao.assunto ?? '' }
    })
    return jsonResponse({ questions })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Erro ao gerar questões com IA' }, 500)
  }
})
