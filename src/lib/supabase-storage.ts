import { supabase } from './supabase'

const BUCKET = 'education-files'

export async function uploadFile(
  file: File,
  path: string
): Promise<{ url: string; error: string | null }> {
  try {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) return { url: '', error: uploadError.message }

    const { data: publicUrl } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path)

    return { url: publicUrl.publicUrl, error: null }
  } catch (err) {
    return { url: '', error: err instanceof Error ? err.message : 'Erro ao fazer upload' }
  }
}

export async function deleteFile(path: string): Promise<string | null> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([path])

    return error ? error.message : null
  } catch (err) {
    return err instanceof Error ? err.message : 'Erro ao deletar arquivo'
  }
}

export function generateFilePath(userId: string, fileName: string): string {
  const ext = fileName.split('.').pop() || 'bin'
  const baseName = fileName.replace(`.${ext}`, '')
  const safeName = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '_')
  return `${userId}/${Date.now()}_${safeName}.${ext}`
}

export async function uploadQuestionMaterial(
  file: File,
  userId: string
): Promise<{ url: string; type: 'image' | 'pdf'; error: string | null }> {
  const isPdf = file.type === 'application/pdf'
  const path = generateFilePath(userId, `material_${file.name}`)
  const { url, error } = await uploadFile(file, path)
  return { url, type: isPdf ? 'pdf' : 'image', error }
}

export async function uploadLessonPdf(
  file: File,
  userId: string
): Promise<{ url: string; error: string | null }> {
  const path = generateFilePath(userId, `lesson_${file.name}`)
  return uploadFile(file, path)
}

export async function uploadCourseCover(
  file: File,
  courseId: string
): Promise<{ url: string; error: string | null }> {
  const path = generateFilePath('course-covers', `${courseId}_${file.name}`)
  return uploadFile(file, path)
}