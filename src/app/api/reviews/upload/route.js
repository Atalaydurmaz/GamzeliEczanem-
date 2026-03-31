import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'reviews')
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req) {
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

  fs.mkdirSync(UPLOAD_DIR, { recursive: true })

  const ext = file.name.split('.').pop().toLowerCase().replace('jpeg', 'jpg')
  const dosyaAdi = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const dosyaYolu = path.join(UPLOAD_DIR, dosyaAdi)

  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(dosyaYolu, buffer)

  return Response.json({ url: `/uploads/reviews/${dosyaAdi}` }, { status: 201 })
}
