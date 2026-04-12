import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Browser-safe client (anon key, RLS kurallarına tabi)
export const supabase = createClient(url, anonKey)

// Server-only client (service role, RLS bypass — sadece API route'larında kullanın)
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
})
