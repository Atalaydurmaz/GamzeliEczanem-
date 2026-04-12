import { supabaseAdmin } from './supabase'

/**
 * Kupon kodunu doğrular.
 * email veya telefon geçilirse ek olarak kişi bazlı tekrar kullanım kontrolü yapar.
 */
export async function validateDiscountCode(kod, toplamFiyat, { email, telefon } = {}) {
  const { data: code } = await supabaseAdmin
    .from('discount_codes')
    .select('*')
    .ilike('kod', kod.trim())
    .single()

  if (!code) return { gecerli: false, hata: 'Geçersiz indirim kodu' }
  if (!code.aktif) return { gecerli: false, hata: 'Bu indirim kodu artık aktif değil' }
  if (code.kullanim_limit !== null && code.kullanim_sayisi >= code.kullanim_limit)
    return { gecerli: false, hata: 'Bu indirim kodunun kullanım limiti doldu' }
  if (toplamFiyat < code.min_siparis)
    return {
      gecerli: false,
      hata: `Bu kod için minimum sipariş tutarı ${Number(code.min_siparis).toLocaleString('tr-TR')} ₺`,
    }

  // Kişi bazlı tekrar kullanım kontrolü (sadece email/telefon sağlanmışsa)
  if (email) {
    const { count } = await supabaseAdmin
      .from('discount_code_usages')
      .select('*', { count: 'exact', head: true })
      .eq('kod', code.kod)
      .eq('email', email.toLowerCase())
    if (count > 0)
      return { gecerli: false, hata: 'Bu indirim kodunu daha önce kullandınız' }
  }

  if (telefon) {
    const { count } = await supabaseAdmin
      .from('discount_code_usages')
      .select('*', { count: 'exact', head: true })
      .eq('kod', code.kod)
      .eq('telefon', telefon)
    if (count > 0)
      return { gecerli: false, hata: 'Bu indirim kodunu daha önce kullandınız' }
  }

  const indirimTutari =
    code.tip === 'yuzde'
      ? Math.round((toplamFiyat * code.deger) / 100)
      : Math.min(code.deger, toplamFiyat)

  return { gecerli: true, kod: code.kod, tip: code.tip, deger: code.deger, indirimTutari }
}

/**
 * Sipariş iptal edildiğinde kupon kullanımını geri alır.
 * discount_code_usages kaydını siler ve discount_codes.kullanim_sayisi'nı 1 azaltır.
 * Döndürür: 'ok' | 'not_found'
 */
export async function cancelDiscountUsage(siparisNo) {
  const { data, error } = await supabaseAdmin.rpc('cancel_discount_usage', {
    p_siparis_no: siparisNo,
  })
  if (error) {
    // Migration 014 henüz uygulanmadıysa manuel fallback (best-effort)
    console.warn('cancel_discount_usage RPC hatası (migration eksik olabilir):', error.message)
    try {
      const { data: usage } = await supabaseAdmin
        .from('discount_code_usages')
        .select('kod')
        .eq('siparis_no', siparisNo)
        .maybeSingle()
      if (usage?.kod) {
        await supabaseAdmin
          .from('discount_code_usages')
          .delete()
          .eq('siparis_no', siparisNo)
        // Sayacı azalt — 0'ın altına düşmemesi için önce mevcut değeri oku
        const { data: dc } = await supabaseAdmin
          .from('discount_codes')
          .select('kullanim_sayisi')
          .eq('kod', usage.kod)
          .single()
        if (dc && dc.kullanim_sayisi > 0) {
          await supabaseAdmin
            .from('discount_codes')
            .update({ kullanim_sayisi: dc.kullanim_sayisi - 1 })
            .eq('kod', usage.kod)
        }
      }
    } catch (fallbackErr) {
      console.error('cancelDiscountUsage fallback hatası:', fallbackErr)
    }
    return 'ok'
  }
  return data // 'ok' | 'not_found'
}

/**
 * Kuponu atomik olarak "kullanıldı" olarak işaretler.
 * Döndürür: 'ok' | 'limit_doldu' | 'zaten_kullanildi' | 'gecersiz'
 *
 * Ödeme başarılı olduğu anda çağrılmalıdır.
 */
export async function incrementUsage(kod, { email, telefon, siparisNo } = {}) {
  const { data, error } = await supabaseAdmin.rpc('increment_discount_usage', {
    p_kod:        kod.trim().toUpperCase(),
    p_email:      email    || null,
    p_telefon:    telefon  || null,
    p_siparis_no: siparisNo || null,
  })
  if (error) {
    // Migration henüz uygulanmadıysa eski davranışa düş
    console.warn('increment_discount_usage RPC hatası (migration eksik olabilir):', error.message)
    await supabaseAdmin
      .from('discount_codes')
      .update({ kullanim_sayisi: supabaseAdmin.raw('kullanim_sayisi + 1') })
      .ilike('kod', kod.trim())
    return 'ok'
  }
  return data // 'ok' | 'limit_doldu' | 'zaten_kullanildi' | 'gecersiz'
}
