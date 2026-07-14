import { corsHeaders } from '../_shared/cors.ts'

const BUNNY_LIBRARY_ID = Deno.env.get('BUNNY_LIBRARY_ID') ?? ''
const BUNNY_API_KEY = Deno.env.get('BUNNY_API_KEY') ?? ''

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
    return jsonResponse({ error: 'Bunny.net não configurado no servidor (BUNNY_LIBRARY_ID/BUNNY_API_KEY ausentes)' }, 500)
  }

  let body: { videoId?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido' }, 400)
  }

  if (!body.videoId) return jsonResponse({ error: 'videoId é obrigatório' }, 400)

  const res = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${body.videoId}`, {
    method: 'DELETE',
    headers: { AccessKey: BUNNY_API_KEY },
  })

  if (!res.ok) {
    const errText = await res.text()
    return jsonResponse({ error: `Falha ao apagar vídeo no Bunny: ${errText}` }, 502)
  }

  return jsonResponse({ ok: true })
})
