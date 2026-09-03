import { supabase } from './supabase'

// supabase.functions.invoke devolve só "Edge Function returned a non-2xx status
// code" quando a function responde com erro — a mensagem real vem no corpo JSON
// ({ error: ... }), acessível via error.context.
export async function functionErrorMessage(
  fnError: { message?: string; context?: { json?: () => Promise<{ error?: string }> } },
  fallback = 'Falha ao processar a requisição. Tente novamente.',
): Promise<string> {
  try {
    const body = await fnError.context?.json?.()
    if (body?.error) return body.error
  } catch {
    // resposta não era JSON — mantém a mensagem genérica
  }
  return fnError.message || fallback
}

// Invoca uma Edge Function que valida a sessão via auth.getUser(token). Sem
// sessão real, o supabase-js manda a chave publishable no lugar do JWT e a
// function volta 401 — aqui a gente checa antes, dá mensagem clara e manda o
// access_token explicitamente no header.
export async function invokeWithAuth<T = unknown>(
  fnName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Sua sessão expirou. Saia e entre novamente para continuar.')
  }
  const { data, error } = await supabase.functions.invoke(fnName, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    body,
  })
  if (error) throw new Error(await functionErrorMessage(error))
  if (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) {
    throw new Error((data as { error: string }).error)
  }
  return data as T
}
