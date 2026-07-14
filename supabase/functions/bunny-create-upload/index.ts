import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const BUNNY_LIBRARY_ID = Deno.env.get('BUNNY_LIBRARY_ID') ?? ''
const BUNNY_API_KEY = Deno.env.get('BUNNY_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

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

  const { userId, title } = body
  if (!userId || !title) {
    return jsonResponse({ error: 'userId e title são obrigatórios' }, 400)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, approved')
    .eq('id', userId)
    .single()

  if (profileError || !profile || !['professor', 'admin'].includes(profile.role) || !profile.approved) {
    return jsonResponse({ error: 'Usuário não autorizado a enviar vídeos' }, 403)
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
