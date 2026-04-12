import { getCurrentUserEmail } from '@/lib/userAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { deleteUserAddress } from '@/lib/userAddresses'

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

export async function DELETE(req, { params }) {
  const userId = await resolveUserId()
  if (!userId) return Response.json({ error: 'Giriş gerekli.' }, { status: 401 })

  const { id } = await params
  if (!id) return Response.json({ error: 'Adres ID gerekli.' }, { status: 400 })

  try {
    await deleteUserAddress(id, userId) // sahiplik kontrolü lib içinde
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 })
  }
}
