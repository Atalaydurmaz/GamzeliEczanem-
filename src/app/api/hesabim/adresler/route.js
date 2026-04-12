import { getCurrentUserEmail } from '@/lib/userAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserAddresses, createUserAddress } from '@/lib/userAddresses'

// Email → user_id çözümleyici (her iki auth yöntemi için)
async function resolveUserId() {
  const email = await getCurrentUserEmail()
  if (!email) return null
  const { data } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  return data?.id ?? null
}

export async function GET() {
  const userId = await resolveUserId()
  if (!userId) return Response.json({ error: 'Giriş gerekli.' }, { status: 401 })
  try {
    const adresler = await getUserAddresses(userId)
    return Response.json(adresler)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  const userId = await resolveUserId()
  if (!userId) return Response.json({ error: 'Giriş gerekli.' }, { status: 401 })

  const body = await req.json()
  const { baslik, ad, telefon, il, ilce, adres } = body

  if (!baslik?.trim()) return Response.json({ error: 'Adres başlığı gerekli.' }, { status: 400 })
  if (!ad?.trim())     return Response.json({ error: 'Ad soyad gerekli.' }, { status: 400 })
  if (!telefon?.trim()) return Response.json({ error: 'Telefon gerekli.' }, { status: 400 })
  if (!il?.trim())     return Response.json({ error: 'İl gerekli.' }, { status: 400 })
  if (!ilce?.trim())   return Response.json({ error: 'İlçe gerekli.' }, { status: 400 })
  if (!adres?.trim())  return Response.json({ error: 'Açık adres gerekli.' }, { status: 400 })

  try {
    const yeniAdres = await createUserAddress(userId, body)
    return Response.json(yeniAdres, { status: 201 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 })
  }
}
