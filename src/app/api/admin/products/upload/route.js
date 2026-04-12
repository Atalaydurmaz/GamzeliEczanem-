import { isAdmin } from '@/lib/adminAuth'

import { supabaseAdmin } from '@/lib/supabase'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']


export async function POST(req) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('gorsel')

  if (!file || typeof file === 'string') {
    return Response.json({ error: 'Dosya bulunamadı' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Sadece JPG, PNG, WEBP veya GIF yükleyebilirsiniz' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'Dosya en fazla 5 MB olabilir' }, { status: 400 })
  }

  const ext = file.name.split('.').pop().toLowerCase().replace('jpeg', 'jpg')
  const dosyaAdi = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabaseAdmin.storage
    .from('uploads')
    .upload(dosyaAdi, buffer, { contentType: file.type, upsert: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('uploads')
    .getPublicUrl(dosyaAdi)

  return Response.json({ url: publicUrl }, { status: 201 })
}
