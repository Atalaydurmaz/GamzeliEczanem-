// Bu import, dosyanın client bundle'a girmesini engeller.
// Herhangi bir 'use client' bileşeni bu dosyayı import ederse
// Next.js build-time'da "This module cannot be imported from a Client Component"
// hatası fırlatır — service_role key'i tarayıcıya asla sızmaz.
import 'server-only'

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Eksik env var — sunucu başlarken hemen hata ver, sessizce undefined geçme
if (!url) {
  throw new Error('[supabase.js] NEXT_PUBLIC_SUPABASE_URL tanımlı değil!')
}
if (!serviceKey) {
  throw new Error('[supabase.js] SUPABASE_SERVICE_ROLE_KEY tanımlı değil!')
}

// Server-only admin client (service_role key, RLS bypass)
// SADECE API route'larında ve server-side lib fonksiyonlarında kullanın.
// Client component'lardan import edilemez — server-only guard yukarıda.
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
