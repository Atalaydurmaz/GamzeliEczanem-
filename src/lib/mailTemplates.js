// ============================================================
// Sipariş / admin bildirim / düşük stok mailleri için
// merkezi HTML şablonları. siparis, odeme/callback, odeme/mock
// rotaları bu helper'dan üretir (daha önce ~120 satır × 3 ≈
// 360 satır duplicate HTML vardı).
// ============================================================

function urunSatirlariHTML(sepet) {
  return sepet.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #fce7f3;color:#44403c">${item.ad}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #fce7f3;text-align:center;color:#78716c">${item.adet}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #fce7f3;text-align:right;font-weight:600;color:#1c1917">${(item.fiyat * item.adet).toLocaleString('tr-TR')} ₺</td>
    </tr>`).join('')
}

/**
 * Müşteriye gönderilen "Siparişiniz Alındı" maili.
 */
export function musteriSiparisOnayMaili({
  siparisNo, adSoyad,
  sepet, toplamFiyat, kargoUcreti, genelToplam,
  indirimKodu, indirimTutari,
  adres, sehir, ilce, postaKodu,
}) {
  const urunSatirlari = urunSatirlariHTML(sepet)
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<style>
  .site-link { color:#fff !important; text-decoration:none; transition:opacity 0.2s ease, transform 0.2s ease; display:inline-block; }
  .site-link:hover { opacity:0.85; transform:translateY(-1px); text-decoration:underline; }
  .site-link:active { opacity:0.7; transform:translateY(0); }
</style>
</head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:580px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:36px 32px;text-align:center">
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:1px">GAMZELİECZANEM</p>
    <p style="margin:10px 0 0;font-size:13px">
      <a href="https://www.instagram.com/gamzelieczanem/" target="_blank" rel="noopener" class="site-link" style="color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
        <span style="display:inline-block;width:18px;height:18px;background:rgba(255,255,255,0.15);border-radius:5px;text-align:center;line-height:18px;font-size:12px;">📷</span>
        @gamzelieczanem
      </a>
    </p>
  </div>
  <div style="padding:32px">
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1c1917">Siparişiniz Alındı! 🎉</h1>
    <p style="margin:0 0 24px;color:#78716c;font-size:15px">Merhaba <strong>${adSoyad}</strong>, siparişiniz başarıyla oluşturuldu.</p>
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center">
      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Sipariş Numarası</p>
      <p style="margin:0;font-size:24px;font-weight:800;color:#f43f5e;letter-spacing:3px">${siparisNo}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead><tr style="background:#fff1f2">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;font-weight:600">Ürün</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#9ca3af;font-weight:600">Adet</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;font-weight:600">Fiyat</th>
      </tr></thead>
      <tbody>${urunSatirlari}</tbody>
    </table>
    <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:#78716c;font-size:14px">Ara Toplam</span><span style="color:#44403c;font-size:14px">${toplamFiyat.toLocaleString('tr-TR')} ₺</span></div>
      ${indirimTutari > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:#10b981;font-size:14px">İndirim (${indirimKodu})</span><span style="color:#10b981;font-size:14px;font-weight:600">-${indirimTutari.toLocaleString('tr-TR')} ₺</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e5e7eb"><span style="color:#78716c;font-size:14px">Kargo</span><span style="color:${kargoUcreti === 0 ? '#10b981' : '#44403c'};font-size:14px;font-weight:600">${kargoUcreti === 0 ? 'Ücretsiz' : kargoUcreti.toLocaleString('tr-TR') + ' ₺'}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:#1c1917;font-size:16px;font-weight:700">Toplam</span><span style="color:#f43f5e;font-size:18px;font-weight:800">${genelToplam.toLocaleString('tr-TR')} ₺</span></div>
    </div>
    <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:16px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase">Teslimat Adresi</p>
      <p style="margin:0;color:#44403c;font-size:14px;line-height:1.6">${adres}<br>${ilce} / ${sehir} ${postaKodu}</p>
    </div>
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px 20px">
      <p style="margin:0;color:#065f46;font-size:14px">🚚 <strong>1–3 iş günü</strong> içinde kargoya verilecek.</p>
    </div>
  </div>
  <div style="background:#fff1f2;padding:20px 32px;text-align:center;border-top:1px solid #fce7f3">
    <a href="mailto:destek@gamzelidermokozmetik.com" style="color:#f43f5e;font-size:13px;font-weight:600;text-decoration:none">destek@gamzelidermokozmetik.com</a>
    <p style="margin:8px 0 0;font-size:12px;color:#d1d5db">0262 412 6928 · Gölcük / Kocaeli</p>
  </div>
</div></body></html>`
}

/**
 * Admin'e gönderilen "Yeni Sipariş" bildirim maili.
 * odemeYontemiHtml: "Kapıda / Havale" | "Kredi/Banka Kartı (iyzico)" | "🧪 Test Ödemesi (Mock)"
 */
export function adminYeniSiparisMaili({
  siparisNo, adSoyad, email, telefon,
  adres, sehir, ilce,
  sepet, genelToplam,
  odemeYontemiHtml,
  siteUrl,
}) {
  const urunSatirlari = sepet.map((item) =>
    `<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px"><span style="color:#44403c">${item.ad} × ${item.adet}</span><span style="font-weight:600;color:#1c1917">${(item.fiyat * item.adet).toLocaleString('tr-TR')} ₺</span></div>`
  ).join('')

  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:24px 32px;text-align:center">
    <p style="margin:0;font-size:20px;font-weight:800;color:#fff">🛍️ Yeni Sipariş!</p>
    <p style="margin:4px 0 0;font-size:13px;color:#fecdd3">GAMZELİECZANEM Admin Bildirimi</p>
  </div>
  <div style="padding:28px 32px">
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:14px 18px;margin-bottom:20px;text-align:center">
      <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Sipariş No</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#f43f5e;letter-spacing:2px">${siparisNo}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px">
      <tr><td style="padding:6px 0;color:#9ca3af;width:120px">Müşteri</td><td style="padding:6px 0;font-weight:600;color:#1c1917">${adSoyad}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af">E-posta</td><td style="padding:6px 0;color:#44403c">${email}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af">Telefon</td><td style="padding:6px 0;color:#44403c">${telefon}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af">Adres</td><td style="padding:6px 0;color:#44403c">${adres}, ${ilce}/${sehir}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af">Ödeme</td><td style="padding:6px 0;color:#44403c">${odemeYontemiHtml}</td></tr>
    </table>
    <div style="background:#f9fafb;border-radius:10px;padding:14px 18px;margin-bottom:16px">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase">Ürünler</p>
      ${urunSatirlari}
      <div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:1px solid #e5e7eb"><span style="font-weight:700;color:#1c1917">Toplam</span><span style="font-weight:800;color:#f43f5e;font-size:16px">${genelToplam.toLocaleString('tr-TR')} ₺</span></div>
    </div>
    <a href="${siteUrl}/admin" style="display:block;text-align:center;padding:12px 24px;background:#f43f5e;color:#fff;font-weight:700;font-size:14px;border-radius:999px;text-decoration:none">Admin Paneline Git →</a>
  </div>
</div></body></html>`
}

/**
 * Düşük stok uyarı maili — admin'e.
 * lowStockItems: [{ ad, stok }]
 */
export function dusukStokUyariMaili({ siparisNo, lowStockItems }) {
  const rows = lowStockItems.map((u) =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #fce7f3">${u.ad}</td><td style="padding:8px 12px;border-bottom:1px solid #fce7f3;text-align:center;font-weight:bold;color:${u.stok === 0 ? '#ef4444' : '#f97316'}">${u.stok === 0 ? 'STOK TÜKENDİ' : u.stok + ' adet kaldı'}</td></tr>`
  ).join('')

  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#f97316,#ef4444);padding:28px 32px;text-align:center">
    <p style="margin:0;font-size:20px;font-weight:800;color:#fff">⚠️ Düşük Stok Uyarısı</p>
    <p style="margin:6px 0 0;font-size:13px;color:#fed7aa">GAMZELİECZANEM</p>
  </div>
  <div style="padding:28px 32px">
    <p style="margin:0 0 16px;color:#44403c;font-size:15px"><strong>${siparisNo}</strong> numaralı sipariş sonrasında aşağıdaki ürünlerin stoğu azaldı:</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#fff7ed"><th style="padding:8px 12px;text-align:left;font-size:12px;color:#9ca3af">Ürün</th><th style="padding:8px 12px;text-align:center;font-size:12px;color:#9ca3af">Durum</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div></body></html>`
}

/**
 * Sipariş onay SMS metni — Türkçe özel karakter yok (Netgsm GET uyumlu).
 */
export function siparisOnaySmsMetni({ siparisNo, genelToplam }) {
  return `GAMZELİECZANEM: Siparişiniz alindi! No: ${siparisNo}, Tutar: ${Number(genelToplam).toFixed(2)} TL. Teşekkürler!`
}
