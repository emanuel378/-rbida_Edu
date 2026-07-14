import { corsHeaders } from '../_shared/cors.ts'

const BUNNY_LIBRARY_ID = Deno.env.get('BUNNY_LIBRARY_ID') ?? ''
const BUNNY_API_KEY = Deno.env.get('BUNNY_API_KEY') ?? ''

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Bunny status: 0/1 criado/enviado, 2/3 processando/codificando, 4 pronto, 5 erro
function mapStatus(bunnyStatus: number): 'uploading' | 'processing' | 'ready' | 'error' {
  if (bunnyStatus <= 1) return 'uploading'
  if (bunnyStatus === 2 || bunnyStatus === 3) return 'processing'
  if (bunnyStatus === 4) return 'ready'
  return 'error'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
    return jsonResponse({ error: 'Bunny.net não configurado no servidor (BUNNY_LIBRARY_ID/BUNNY_API_KEY ausentes)' }, 500)
  }

  const url = new URL(req.url)
  const videoId = url.searchParams.get('videoId')
  if (!videoId) return jsonResponse({ error: 'videoId é obrigatório' }, 400)

  const res = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
    headers: { AccessKey: BUNNY_API_KEY },
  })

  if (!res.ok) {
    const errText = await res.text()
    return jsonResponse({ error: `Falha ao consultar vídeo no Bunny: ${errText}` }, 502)
  }

  const data = await res.json()
  return jsonResponse({ status: mapStatus(data.status) })
})
