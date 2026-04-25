/**
 * Merkezi Zod şema & doğrulama yardımcıları
 *
 * Kullanım:
 *   const { ok, data, response } = await parseBody(LoginSchema, req)
 *   if (!ok) return response          // 400 otomatik dönüyor
 *   const { email, sifre } = data     // tip-güvenli, temizlenmiş veri
 */
import { z } from 'zod'

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

/**
 * Request body'yi okur, verilen şemaya göre doğrular.
 * Başarılıda  { ok: true, data }
 * Başarısızda { ok: false, response }   ← doğrudan return edilebilir
 */
export async function parseBody(schema, req) {
  let raw
  try {
    raw = await req.json()
  } catch {
    return {
      ok: false,
      response: Response.json({ error: 'Geçersiz istek gövdesi (JSON bekleniyor).' }, { status: 400 }),
    }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const ilk = result.error.errors[0]
    const alan = ilk.path.length ? ilk.path.join('.') : undefined
    return {
      ok: false,
      response: Response.json(
        { error: ilk.message, ...(alan && { alan }) },
        { status: 400 }
      ),
    }
  }

  return { ok: true, data: result.data }
}

// ─── Tekrar Kullanılan Tipler ──────────────────────────────────────────────────

const email = z
  .string({ required_error: 'E-posta zorunludur.' })
  .trim()
  .email({ message: 'Geçerli bir e-posta adresi girin.' })
  .max(200, 'E-posta en fazla 200 karakter olabilir.')
  .toLowerCase()

const telefon = z
  .string()
  .trim()
  .max(20, 'Telefon en fazla 20 karakter olabilir.')
  .optional()
  .or(z.literal(''))

const pozitifTamsayi = z.number({ invalid_type_error: 'Sayı olmalıdır.' }).int().positive()

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email,
  sifre: z
    .string({ required_error: 'Şifre zorunludur.' })
    .min(1, 'Şifre boş olamaz.')
    .max(200, 'Şifre çok uzun.'),
})

export const RegisterSchema = z.object({
  ad: z
    .string({ required_error: 'Ad zorunludur.' })
    .trim()
    .min(2, 'Ad en az 2 karakter olmalıdır.')
    .max(100, 'Ad en fazla 100 karakter olabilir.'),
  email,
  sifre: z
    .string({ required_error: 'Şifre zorunludur.' })
    .regex(
      /^(?=.*[a-zA-ZğüşıöçĞÜŞİÖÇ])(?=.*\d).{8,32}$/,
      'Şifreniz 8-32 karakter arasında olmalı, en az bir harf ve rakam içermelidir.'
    ),
  onaylar: z
    .object({
      email:   z.boolean().optional().default(false),
      sms:     z.boolean().optional().default(false),
      telefon: z.boolean().optional().default(false),
    })
    .optional()
    .default({}),
})

export const CheckEmailSchema = z.object({
  email,
})

// ─── İletişim Formu ───────────────────────────────────────────────────────────

export const IletisimSchema = z.object({
  ad: z
    .string({ required_error: 'Ad zorunludur.' })
    .trim()
    .min(2, 'Ad en az 2 karakter olmalıdır.')
    .max(100, 'Ad en fazla 100 karakter olabilir.'),
  email,
  telefon,
  konu: z
    .string({ required_error: 'Konu zorunludur.' })
    .trim()
    .min(2, 'Konu en az 2 karakter olmalıdır.')
    .max(200, 'Konu en fazla 200 karakter olabilir.'),
  mesaj: z
    .string({ required_error: 'Mesaj zorunludur.' })
    .trim()
    .min(1, 'Mesaj boş olamaz.')
    .max(2000, 'Mesaj en fazla 2000 karakter olabilir.'),
  faxNumber: z.string().optional(), // honeypot — doğrulanmaz, sadece kontrol edilir
})

// ─── Yorum ────────────────────────────────────────────────────────────────────

export const ReviewSchema = z.object({
  urunId: pozitifTamsayi.max(999999, 'Geçersiz ürün ID.'),
  kullaniciAd: z
    .string({ required_error: 'Kullanıcı adı zorunludur.' })
    .trim()
    .min(2, 'İsim en az 2 karakter olmalıdır.')
    .max(100, 'İsim en fazla 100 karakter olabilir.'),
  puan: z
    .number({ required_error: 'Puan zorunludur.', invalid_type_error: 'Puan sayı olmalıdır.' })
    .int('Puan tam sayı olmalıdır.')
    .min(1, 'Puan en az 1 olabilir.')
    .max(5, 'Puan en fazla 5 olabilir.'),
  yorum: z
    .string({ required_error: 'Yorum zorunludur.' })
    .trim()
    .min(10, 'Yorum en az 10 karakter olmalıdır.')
    .max(1000, 'Yorum en fazla 1000 karakter olabilir.'),
  fotolar: z
    .array(
      z.string().url('Geçersiz fotoğraf URL.').max(500, 'URL çok uzun.')
    )
    .max(5, 'En fazla 5 fotoğraf eklenebilir.')
    .optional(),
})

// ─── İndirim Kodu ─────────────────────────────────────────────────────────────

export const IndirimSchema = z.object({
  kod: z
    .string({ required_error: 'İndirim kodu zorunludur.' })
    .trim()
    .min(1, 'İndirim kodu boş olamaz.')
    .max(50, 'İndirim kodu en fazla 50 karakter olabilir.'),
  toplamFiyat: z
    .number({ required_error: 'Toplam fiyat zorunludur.', invalid_type_error: 'Toplam fiyat sayı olmalıdır.' })
    .positive('Toplam fiyat sıfırdan büyük olmalıdır.')
    .max(1_000_000, 'Geçersiz tutar.'),
})

// ─── Stok Bildirimi ───────────────────────────────────────────────────────────

export const StokBildirimiSchema = z.object({
  urunId: pozitifTamsayi.max(999999, 'Geçersiz ürün ID.'),
  email,
})

// ─── İade Talebi ─────────────────────────────────────────────────────────────

const IadeUrunSchema = z.object({
  id:   pozitifTamsayi,
  ad:   z.string().trim().min(1).max(300),
  adet: pozitifTamsayi.max(100),
})

export const IadeSchema = z.object({
  siparisNo: z
    .string({ required_error: 'Sipariş numarası zorunludur.' })
    .trim()
    .min(1)
    .max(50, 'Sipariş numarası çok uzun.'),
  // musteriEmail artık body'den kabul edilmez — sahiplik session'dan doğrulanır
  urunler: z
    .array(IadeUrunSchema)
    .min(1, 'En az bir ürün seçilmelidir.')
    .max(50, 'Çok fazla ürün.'),
  neden: z.enum(
    ['hasarli', 'yanlis-urun', 'kalite', 'fikir-degistim', 'diger'],
    { invalid_type_error: 'Geçersiz iade nedeni.' }
  ),
  aciklama: z.string().trim().max(1000, 'Açıklama en fazla 1000 karakter.').optional(),
})

// ─── Admin — Ürün Güncelleme ─────────────────────────────────────────────────

export const AdminProductUpdateSchema = z.object({
  ad:          z.string().trim().min(1).max(300).optional(),
  kategori:    z.string().trim().min(1).max(100).optional(),
  altKategori: z.string().trim().max(100).nullable().optional(),
  fiyat:       z.number().positive('Fiyat sıfırdan büyük olmalıdır.').max(100_000).optional(),
  eskiFiyat:   z.number().positive().max(100_000).nullable().optional(),
  aciklama:    z.string().trim().max(1000).nullable().optional(),
  detay:       z.string().trim().max(5000).nullable().optional(),
  ciltTipi:    z.string().trim().max(1000).nullable().optional(),
  kullanim:    z.string().trim().max(1000).nullable().optional(),
  rutinOnerisi:z.string().trim().max(1500).nullable().optional(),
  icerik:      z.string().trim().max(5000).nullable().optional(),
  skt:         z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{4}$/, 'SKT formatı MM/YYYY olmalıdır.').nullable().optional(),
  gorsel:      z.string().url('Geçersiz görsel URL.').max(500).nullable().optional(),
  etiket:      z.string().trim().max(50).nullable().optional(),
  aktif:       z.boolean().optional(),
  stok:        z.number().int().min(0, 'Stok negatif olamaz.').max(10_000).optional(),
}).strict({ message: 'Bilinmeyen alan gönderildi.' })

// ─── Sipariş (Kapıda/Havale) — yapısal kontrol ────────────────────────────────
// Fiyat doğrulaması sunucu tarafında hesaplaSiparisDetay ile yapılır;
// bu şema yalnızca veri tipini ve uzunluğunu denetler.

const SepetItemSchema = z.object({
  id:    pozitifTamsayi,
  ad:    z.string().trim().min(1).max(300),
  fiyat: z.number().positive().max(100_000),
  adet:  pozitifTamsayi.max(100),
})

export const FaturaSchema = z.object({
  tip:         z.enum(['bireysel', 'kurumsal']),
  tckn:        z.string().trim().regex(/^\d{11}$/).optional().or(z.literal('')),
  firmaUnvani: z.string().trim().max(200).optional().or(z.literal('')),
  vergiDairesi:z.string().trim().max(100).optional().or(z.literal('')),
  vergiNo:     z.string().trim().regex(/^\d{10}$/).optional().or(z.literal('')),
  ayniAdres:   z.boolean().default(true),
  adres:       z.string().trim().max(500).optional().or(z.literal('')),
  sehir:       z.string().trim().max(100).optional().or(z.literal('')),
  ilce:        z.string().trim().max(100).optional().or(z.literal('')),
  postaKodu:   z.string().trim().regex(/^\d{5}$/).optional().or(z.literal('')),
}).optional()

export const SiparisSchema = z.object({
  // siparisNo artık sunucu tarafında üretilir — client'tan kabul edilmez
  adSoyad:   z.string().trim().min(2).max(100),
  email,
  telefon:   z.string().trim().min(10).max(20),
  adres:     z.string().trim().min(10).max(500),
  sehir:     z.string().trim().min(1).max(100),
  ilce:      z.string().trim().min(1).max(100),
  postaKodu: z.string().trim().regex(/^\d{5}$/, 'Posta kodu 5 haneli sayı olmalıdır.'),
  fatura:    FaturaSchema,
  sepet:     z.array(SepetItemSchema).min(1, 'Sepet boş olamaz.').max(50),
  odemeTipi: z.enum(['kapida', 'havale']),
  indirimKodu: z.string().trim().max(50).optional().nullable(),
  uyeIndirimi: z.number().min(0).max(100_000).optional().default(0),
})
