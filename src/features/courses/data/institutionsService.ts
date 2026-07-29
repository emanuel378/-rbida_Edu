import type { Institution } from './mock'
import { supabase } from '../../../lib/supabase'

const fromRow = (row: Record<string, unknown>): Institution => ({
  id: row.id as string,
  name: row.name as string,
  createdAt: row.created_at as string,
})

export const fetchInstitutions = async (): Promise<Institution[]> => {
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export const addInstitution = async (institution: Institution): Promise<void> => {
  const { error } = await supabase
    .from('institutions')
    .insert([{ id: institution.id, name: institution.name }])
  if (error) throw new Error(error.message)
}

export const deleteInstitution = async (id: string): Promise<void> => {
  const { error } = await supabase.from('institutions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
