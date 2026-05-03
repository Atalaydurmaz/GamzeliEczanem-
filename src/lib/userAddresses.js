import { supabaseAdmin } from './supabase'
import { normalizeSehir, normalizeIlce } from './tr-iller'

function mapRow(row) {
  return {
    id:         row.id,
    baslik:     row.baslik,
    ad:         row.ad,
    telefon:    row.telefon,
    il:         row.il,
    ilce:       row.ilce,
    mahalle:    row.mahalle ?? '',
    adres:      row.adres,
    postaKodu:  row.posta_kodu ?? '',
    varsayilan: row.varsayilan ?? false,
  }
}

export async function getUserAddresses(userId) {
  const { data, error } = await supabaseAdmin
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('varsayilan', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapRow)
}

export async function createUserAddress(userId, fields) {
  const { baslik, ad, telefon, il, ilce, mahalle, adres, postaKodu } = fields

  // İl/ilçeyi kanonik forma çevir — dropdown bypass edilse bile DB tutarlı kalır.
  // Eşleşmezse normalizeSehir/normalizeIlce string fırlatır → kullanıcıya 400 döner.
  let kanonikIl, kanonikIlce
  try {
    kanonikIl = normalizeSehir(il)
    kanonikIlce = normalizeIlce(kanonikIl, ilce)
  } catch (e) {
    throw new Error(typeof e === 'string' ? e : 'Geçersiz il/ilçe.')
  }

  // Kullanıcının toplam adres sayısını sınırla (max 10)
  const { count } = await supabaseAdmin
    .from('user_addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if ((count ?? 0) >= 10) {
    throw new Error('En fazla 10 adres kaydedebilirsiniz.')
  }

  const { data, error } = await supabaseAdmin
    .from('user_addresses')
    .insert({
      user_id:    userId,
      baslik:     baslik.trim().slice(0, 50),
      ad:         ad.trim().slice(0, 100),
      telefon:    telefon.trim().slice(0, 20),
      il:         kanonikIl,
      ilce:       kanonikIlce,
      mahalle:    mahalle?.trim().slice(0, 100) || null,
      adres:      adres.trim().slice(0, 500),
      posta_kodu: postaKodu?.trim().slice(0, 10) || null,
    })
    .select()
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function deleteUserAddress(addressId, userId) {
  const { error } = await supabaseAdmin
    .from('user_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId) // sahiplik kontrolü
  if (error) throw error
}
