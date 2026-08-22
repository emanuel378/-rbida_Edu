import { createClient } from '@supabase/supabase-js'

// Fallback para o projeto atual de produção — mantém o app funcionando mesmo
// sem VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY definidas (ex.: antes de
// configurar os ambientes na Vercel). Para apontar pra outro projeto
// (homologação, teste local), defina essas duas variáveis no .env.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dxkzktkeagpddmpcyooe.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_yx-UtDC0MIeiT5vITXk0Cw_oxTpa37x'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const isSupabaseConfigured = () => true
