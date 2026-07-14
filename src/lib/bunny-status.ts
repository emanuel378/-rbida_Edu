import { supabase } from './supabase'

export type BunnyVideoStatus = 'uploading' | 'processing' | 'ready' | 'error'

export async function fetchBunnyVideoStatus(videoId: string): Promise<BunnyVideoStatus> {
  const { data, error } = await supabase.functions.invoke(
    `bunny-video-status?videoId=${encodeURIComponent(videoId)}`,
    { method: 'GET' }
  )

  if (error || !data?.status) return 'error'
  return data.status as BunnyVideoStatus
}
