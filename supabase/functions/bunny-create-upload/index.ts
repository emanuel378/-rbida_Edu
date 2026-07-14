import { corsHeaders } from '../_shared/cors.ts'

const BUNNY_LIBRARY_ID = Deno.env.get('BUNNY_LIBRARY_ID') ?? ''
const BUNNY_API_KEY = Deno.env.get('BUNNY_API_KEY') ?? ''

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
    return jsonResponse({ error: 'Bunny.net não configurado no servidor (BUNNY_LIBRARY_ID/BUNNY_API_KEY ausentes)' }, 500)
  }

  let body: { userId?: string; title?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido' }, 400)
  }

  // Não há checagem de role via `profiles` aqui: o login deste app é mockado
  // (não gera sessão real do Supabase Auth) e a tabela `profiles` fica vazia,
  // então uma checagem de role seria só teatro de segurança. O app inteiro já
  // roda com RLS desligado e chave anônima pública — mesmo modelo de confiança
  // aqui. Revisitar quando o login real for implementado.
  const { userId, title } = body
  if (!userId || !title) {
    return jsonResponse({ error: 'userId e title são obrigatórios' }, 400)
  }

  const createRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`, {
    method: 'POST',
    headers: { AccessKey: BUNNY_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })

  if (!createRes.ok) {
    const errText = await createRes.text()
    return jsonResponse({ error: `Falha ao criar vídeo no Bunny: ${errText}` }, 502)
  }

  const created = await createRes.json()
  const videoId = created.guid as string
  const expiration = Math.floor(Date.now() / 1000) + 3600
  const signature = await sha256Hex(`${BUNNY_LIBRARY_ID}${BUNNY_API_KEY}${expiration}${videoId}`)

  return jsonResponse({ videoId, libraryId: BUNNY_LIBRARY_ID, signature, expiration })
})
