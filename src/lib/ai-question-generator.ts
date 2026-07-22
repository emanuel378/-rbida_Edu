import { supabase } from './supabase'

export interface GeneratedQuestion {
  question: string
  options: string[]
  correctAnswer: number
  assunto: string
  banca: string
  ano: string
  nivel: string
  gabaritoComentado: string
}

export interface MaterialFile {
  url: string
  mimeType: string
}

export async function generateQuestionsFromMaterial(
  materials: MaterialFile[],
  answerKeys: MaterialFile[],
  customInstructions?: string
): Promise<GeneratedQuestion[]> {
  const { data, error } = await supabase.functions.invoke('ai-generate-questions', {
    body: { materials, answerKeys, customInstructions },
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

  if (!Array.isArray(data?.questions)) {
    throw new Error(data?.error || 'A IA não retornou nenhuma questão')
  }

  return data.questions as GeneratedQuestion[]
}
