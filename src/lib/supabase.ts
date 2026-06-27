import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://dxkzktkeagpddmpcyooe.supabase.co',
  'sb_publishable_yx-UtDC0MIeiT5vITXk0Cw_oxTpa37x'
)

export const isSupabaseConfigured = () => true