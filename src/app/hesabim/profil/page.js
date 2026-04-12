'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useAuth } from '@/context/AuthContext'

export default function ProfilimDetayPage() {
  const { kullanici, googleGiris } = useCurrentUser()
  const { onaylariGuncelle, profilGuncelle } = useAuth()

  const onaylar = kullanici?.onaylar ?? { email: false, sms: false, telefon: false }
  const [kaydediliyor, setKaydediliyor] = useState(null)
  const [kaydedildi, setKaydedildi] = useState(null)

  // Şifre değiştirme state
  const [sifreFormu, setSifreFormu] = useState({ eskiSifre: '', yeniSifre: '', yeniSifreTekrar: '' })
  const [sifreHata, setSifreHata] = useState('')
  const [sifreBasarili, setSifreBasarili] = useState(false)
  const [sifreYukleniyor, setSifreYukleniyor] = useState(false)

  async function toggle(alan) {
    setKaydediliyor(alan)
    const yeni = !onaylar[alan]
    await onaylariGuncelle({ [alan]: yeni })
    setKaydedildi(alan)
    setTimeout(() => setKaydedildi(null), 2000)
    setKaydediliyor(null)
  }

  async function handleSifreDegistir(e) {
    e.preventDefault()
    setSifreHata('')
    setSifreBasarili(false)
    if (!sifreFormu.eskiSifre) { setSifreHata('Mevcut şifrenizi girin.'); return }
    const SIFRE_RE = /^(?=.*[a-zA-ZğüşıöçĞÜŞİÖÇ])(?=.*\d).{8,32}$/
    if (!SIFRE_RE.test(sifreFormu.yeniSifre)) { setSifreHata('Şifreniz 8-32 karakter arasında olmalı, en az bir harf ve rakam içermelidir.'); return }
    if (sifreFormu.yeniSifre !== sifreFormu.yeniSifreTekrar) { setSifreHata('Şifreler eşleşmiyor.'); return }
    setSifreYukleniyor(true)
    const sonuc = await profilGuncelle({ eskiSifre: sifreFormu.eskiSifre, yeniSifre: sifreFormu.yeniSifre })
    setSifreYukleniyor(false)
    if (sonuc.basarili) {
      setSifreBasarili(true)
      setSifreFormu({ eskiSifre: '', yeniSifre: '', yeniSifreTekrar: '' })
    } else {
      setSifreHata(sonuc.hata)
    }
  }

  if (!kullanici) return null

  const kayitTarihi = (kullanici.kayit_tarihi || kullanici.kayitTarihi)
    ? new Date(kullanici.kayit_tarihi || kullanici.kayitTarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="space-y-6">
      {/* Profil Bilgileri */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-5 border-b border-stone-100">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Profil Bilgilerim</h2>
            <p className="text-sm text-stone-400 mt-0.5">Kişisel bilgilerinizi buradan görüntüleyebilirsiniz.</p>
          </div>
          {googleGiris && (
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold border border-blue-100">
              Google Hesabı
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Ad Soyad</label>
            <div className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 font-semibold text-stone-800 text-sm">
              {kullanici.ad || '—'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">E-Posta Adresi</label>
            <div className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 font-semibold text-stone-800 text-sm">
              {kullanici.email || '—'}
            </div>
          </div>

          {kayitTarihi && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Üyelik Tarihi</label>
              <div className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-stone-600 text-sm">
                {kayitTarihi}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Şifre Değiştir — email/şifre ile giriş yapanlar için */}
      {!googleGiris && (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 sm:p-8">
          <div className="mb-6 pb-5 border-b border-stone-100">
            <h2 className="text-xl font-bold text-stone-900">Şifre Değiştir</h2>
            <p className="text-sm text-stone-400 mt-0.5">Güvenliğiniz için şifrenizi düzenli olarak değiştirin.</p>
          </div>

          {sifreBasarili && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 mb-5">
              ✓ Şifreniz başarıyla güncellendi.
            </div>
          )}

          <form onSubmit={handleSifreDegistir} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Mevcut Şifre</label>
              <input
                type="password"
                placeholder="••••••••"
                value={sifreFormu.eskiSifre}
                onChange={(e) => setSifreFormu(f => ({ ...f, eskiSifre: e.target.value }))}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Yeni Şifre</label>
              <input
                type="password"
                placeholder="8-32 karakter, harf ve rakam içermeli"
                value={sifreFormu.yeniSifre}
                onChange={(e) => setSifreFormu(f => ({ ...f, yeniSifre: e.target.value }))}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Yeni Şifre Tekrar</label>
              <input
                type="password"
                placeholder="Şifrenizi tekrar girin"
                value={sifreFormu.yeniSifreTekrar}
                onChange={(e) => setSifreFormu(f => ({ ...f, yeniSifreTekrar: e.target.value }))}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              />
            </div>

            {sifreHata && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{sifreHata}</div>
            )}

            <button
              type="submit"
              disabled={sifreYukleniyor}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60"
            >
              {sifreYukleniyor ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
            </button>
          </form>
        </div>
      )}

      {/* Google hesabı için şifre ekleme */}
      {googleGiris && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
          <div className="flex items-start gap-4">
            <span className="text-2xl">🔑</span>
            <div>
              <h3 className="font-bold text-stone-900 mb-1">E-posta ile de giriş yapmak ister misiniz?</h3>
              <p className="text-sm text-stone-500 mb-3">Google hesabınıza ek olarak e-posta/şifre ile de giriş yapabilmek için şifre belirleyebilirsiniz.</p>
              <Link
                href="/hesabim/sifre-olustur"
                className="inline-block px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition-all"
              >
                Şifre Belirle
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KVKK & Ticari İletişim Yönetimi */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 sm:p-8">
        <div className="mb-5 pb-5 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-900">Ticari İletişim İzinleri</h2>
          <p className="text-sm text-stone-400 mt-0.5">Bildirim tercihlerinizi istediğiniz zaman güncelleyebilirsiniz.</p>
        </div>

        <div className="space-y-3">
          {[
            { alan: 'email', baslik: 'E-posta Bildirimleri', aciklama: 'Kampanya, indirim ve yeni ürün bilgilendirmeleri', ikon: '✉️' },
            { alan: 'sms', baslik: 'SMS Bildirimleri', aciklama: 'Kampanya ve sipariş bilgilendirmeleri', ikon: '💬' },
            { alan: 'telefon', baslik: 'Telefon İletişimi', aciklama: 'Müşteri hizmetleri ve bilgilendirme aramaları', ikon: '📞' },
          ].map(({ alan, baslik, aciklama, ikon }) => (
            <div key={alan} className="flex items-center justify-between gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="flex items-center gap-3">
                <span className="text-xl">{ikon}</span>
                <div>
                  <p className="text-sm font-semibold text-stone-800">{baslik}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{aciklama}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(alan)}
                disabled={kaydediliyor === alan || googleGiris}
                title={googleGiris ? 'Google hesabı için bu özellik mevcut değil' : ''}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${onaylar[alan] ? 'bg-rose-500' : 'bg-stone-300'} ${googleGiris ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${onaylar[alan] ? 'left-7' : 'left-1'}`} />
                {kaydedildi === alan && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-green-600 font-semibold whitespace-nowrap">Kaydedildi</span>
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-stone-400 mt-4 leading-relaxed">
          Bu tercihlerinizi istediğiniz zaman güncelleyebilirsiniz. Detaylar için{' '}
          <Link href="/gizlilik-politikasi" className="text-rose-500 hover:underline">Gizlilik Politikamızı</Link> inceleyebilirsiniz.
        </p>
      </div>
    </div>
  )
}
