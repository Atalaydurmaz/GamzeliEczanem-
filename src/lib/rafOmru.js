// Shelf life in days by altKategori (subcategory), then kategori (category) fallback
const ALT_KATEGORI_RAF_OMRU = {
  // Cilt bakımı
  nemlendirici: 90,
  serum: 90,
  'goz-kremi': 120,
  temizleyici: 120,
  tonik: 120,
  maske: 60,
  peeling: 60,
  'gunes-kremi': 90,

  // Makyaj
  fondoten: 180,
  kapatici: 180,
  allik: 180,
  far: 180,
  ruj: 180,
  maskara: 90,
  eyeliner: 90,

  // Saç bakımı
  sampuan: 120,
  'sac-maskesi': 60,
  'sac-serumu': 90,
  'sac-yagi': 90,
  'sac-spreyi': 120,
}

const KATEGORI_RAF_OMRU = {
  'cilt-bakimi': 90,
  makyaj: 180,
  parfum: 365,
  'sac-bakimi': 120,
  'gunes-bakimi': 90,
  'anne-bebek': 60,
  'agiz-bakimi': 90,
}

const VARSAYILAN = 90

export function getRafOmruGun(urun) {
  if (urun.altKategori && ALT_KATEGORI_RAF_OMRU[urun.altKategori] !== undefined) {
    return ALT_KATEGORI_RAF_OMRU[urun.altKategori]
  }
  return KATEGORI_RAF_OMRU[urun.kategori] ?? VARSAYILAN
}

export function getPlanlanmaTarihi(siparisTarihi, rafOmruGun) {
  const d = new Date(siparisTarihi)
  d.setDate(d.getDate() + rafOmruGun)
  return d.toISOString()
}
