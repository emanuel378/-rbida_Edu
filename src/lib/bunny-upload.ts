import { Upload } from 'tus-js-client'
import { supabase } from './supabase'

export interface BunnyUploadResult {
  videoId: string
}

export async function uploadVideoToBunny(
  file: File,
  userId: string,
  title: string,
  onProgress?: (percent: number) => void
): Promise<BunnyUploadResult> {
  const { data, error } = await supabase.functions.invoke('bunny-create-upload', {
    body: { userId, title },
  })

  if (error) {
    let message = error.message as string
    try {
      const body = await error.context?.json()
      if (body?.error) message = body.error
    } catch {
      // resposta não era JSON, mantém a mensagem genérica
    }
    throw new Error(message)
  }

  if (!data?.videoId) {
    throw new Error(data?.error || 'Falha ao iniciar upload no Bunny')
  }

  const { videoId, libraryId, signature, expiration } = data as {
    videoId: string
    libraryId: string
    signature: string
    expiration: number
  }

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: 'https://video.bunnycdn.com/tusupload',
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 50 * 1024 * 1024,
      headers: {
        AuthorizationSignature: signature,
        AuthorizationExpire: String(expiration),
        VideoId: videoId,
        LibraryId: libraryId,
      },
      metadata: {
        filetype: file.type,
        title,
      },
      onError: reject,
      onProgress: (bytesUploaded, bytesTotal) => {
        onProgress?.(Math.round((bytesUploaded / bytesTotal) * 100))
      },
      onSuccess: () => resolve(),
    })

    upload.start()
  })

  return { videoId }
}
