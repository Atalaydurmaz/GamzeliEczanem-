import { supabaseAdmin } from '@/lib/supabase'
import { rateLimit, getIp } from '@/lib/rateLimit'
import { createClient } from '@supabase/supabase-js'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  // Rate limit: IP başına saatte 10 yükleme
  const ip = getIp(req)
  const rl = await rateLimit(`upload:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.ok) {
    return Response.json(
      { error: 'Çok fazla yükleme yaptınız. Lütfen bir saat sonra tekrar deneyin.' },
      { status: 429 }
    )
  }

  // Auth kontrolü: sadece giriş yapmış kullanıcılar yükleyebilir
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Bu işlem için giriş yapmanız gerekiyor.' }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return Response.json({ error: 'Geçersiz oturum. Lütfen tekrar giriş yapın.' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('foto')

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
  const dosyaAdi = `reviews/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
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
