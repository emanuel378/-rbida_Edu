// Library ID do Bunny Stream (não é segredo — só a AccessKey da Library é privada,
// e essa fica apenas nos secrets das Edge Functions). Preencha após criar a
// Stream Video Library em https://dash.bunny.net.
export const BUNNY_LIBRARY_ID = '703960'

export const isBunnyConfigured = () => BUNNY_LIBRARY_ID.trim() !== ''

export function getBunnyEmbedUrl(videoId: string): string {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?autoplay=false`
}
