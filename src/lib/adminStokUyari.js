import { sendMail } from './notify'
import { supabaseAdmin } from './supabase'

const ESIK = 5 // bu değer altına düşünce uyarı gider

/**
 * Verilen ürün listesi için stok threshold kontrol eder,
 * düşük/tükenmiş ürünleri admin'e e-posta ile bildirir.
 * urunIds = [{ id, ad?, stok }]  -- stok zaten biliniyorsa geçirilebilir
 */
export async function adminStokUyariGonder(urunIds) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER
  if (!adminEmail) return

  // Ürün adlarını çek
  const ids = urunIds.map((u) => u.id)
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, ad')
    .in('id', ids)

  const adMap = Object.fromEntries((products || []).map((p) => [p.id, p.ad]))

  const dusukStok = urunIds.filter((u) => u.stok > 0 && u.stok <= ESIK)
  const tukendi   = urunIds.filter((u) => u.stok <= 0)

  if (dusukStok.length === 0 && tukendi.length === 0) return

  const satirOlustur = (list, renk, ikon) =>
    list.map((u) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6">
          <span style="font-size:16px">${ikon}</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;color:#1c1917;font-weight:600">
          ${adMap[u.id] ?? `Ürün #${u.id}`}
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;text-align:center">
          <span style="background:${renk.bg};color:${renk.text};padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700">
            ${u.stok <= 0 ? 'Tükendi' : u.stok + ' adet'}
          </span>
        </td>
      </tr>`).join('')

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:32px;text-align:center">
      <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:1px">GAMZELİECZANEM</p>
      <p style="margin:6px 0 0;font-size:13px;color:#fecdd3">Stok Uyarısı</p>
    </div>
    <div style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1c1917">⚠️ Stok Uyarısı</h1>
      <p style="margin:0 0 24px;color:#78716c;font-size:15px">Aşağıdaki ürünlerin stoğu kritik seviyeye düştü.</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="background:#fff1f2">
            <th style="padding:10px 16px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase"></th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase">Ürün</th>
            <th style="padding:10px 16px;text-align:center;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase">Stok</th>
          </tr>
        </thead>
        <tbody>
          ${tukendi.length > 0 ? satirOlustur(tukendi, { bg: '#fee2e2', text: '#dc2626' }, '🔴') : ''}
          ${dusukStok.length > 0 ? satirOlustur(dusukStok, { bg: '#fef3c7', text: '#d97706' }, '🟡') : ''}
        </tbody>
      </table>

      <div style="text-align:center">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://gamzelieczanem.com'}/admin"
           style="display:inline-block;padding:14px 32px;background:#f43f5e;color:#fff;font-weight:700;font-size:15px;border-radius:999px;text-decoration:none">
          Admin Paneline Git
        </a>
      </div>
    </div>
    <div style="background:#fff1f2;padding:20px 32px;text-align:center;border-top:1px solid #fce7f3">
      <p style="margin:0;font-size:12px;color:#9ca3af">Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>`

  await sendMail({
    from: `"GAMZELİECZANEM Stok" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `⚠️ Stok Uyarısı – ${tukendi.length} tükendi, ${dusukStok.length} kritik`,
    html,
    context: 'admin-stok-uyari',
  })
}

export { ESIK }
