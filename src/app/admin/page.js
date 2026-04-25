'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStock } from '@/context/StockContext'

const DURUMLAR = ['Hazırlanıyor', 'Kargoya Verildi', 'Teslim Edildi', 'İptal Edildi']

const DURUM_STIL = {
  'Hazırlanıyor':    'bg-amber-100 text-amber-700 border border-amber-200',
  'Kargoya Verildi': 'bg-blue-100 text-blue-700 border border-blue-200',
  'Teslim Edildi':   'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'İptal Talebi':    'bg-orange-100 text-orange-700 border border-orange-200',
  'İptal Edildi':    'bg-red-100 text-red-600 border border-red-200',
}

function ConfirmModal({ title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel()
      else if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onConfirm, onCancel])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-100 w-full max-w-md overflow-hidden animate-[popIn_180ms_cubic-bezier(0.2,0.9,0.3,1.1)]">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${danger ? 'bg-red-50 text-red-500' : 'bg-rose-50 text-rose-500'}`}>
              {danger ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-stone-900 mb-1">{title || 'Emin misiniz?'}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
          >
            {cancelLabel || 'İptal'}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-rose-500 hover:bg-rose-600'}`}
          >
            {confirmLabel || 'Onayla'}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(6px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
    </div>
  )
}

function useConfirm() {
  const [state, setState] = useState(null)
  const ask = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setState({ message, resolve, ...options })
    })
  }, [])
  const handle = (ok) => {
    state?.resolve(ok)
    setState(null)
  }
  const modal = state ? (
    <ConfirmModal
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      danger={state.danger}
      onConfirm={() => handle(true)}
      onCancel={() => handle(false)}
    />
  ) : null
  return [ask, modal]
}

function StatKart({ baslik, deger, alt, ikon }) {
  return (
    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{ikon}</span>
      </div>
      <p className="text-2xl font-bold text-stone-900 mb-0.5">{deger}</p>
      <p className="text-sm font-medium text-stone-700">{baslik}</p>
      {alt && <p className="text-xs text-stone-400 mt-0.5">{alt}</p>}
    </div>
  )
}


function SiparisDetay({ siparis, onKargoKaydet, onFaturaDegisti }) {
  const [takipNo, setTakipNo] = useState(siparis.kargoTakipNo || '')
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [gonderildi, setGonderildi] = useState(false)
  const [faturaYukleniyor, setFaturaYukleniyor] = useState(false)
  const [faturaHata, setFaturaHata] = useState('')
  const [askConfirm, confirmEl] = useConfirm()
  const faturaPdfPath = siparis.teslimat?.fatura?.pdfPath

  async function handleKaydet() {
    if (!takipNo.trim()) return
    setKaydediliyor(true)
    await onKargoKaydet(siparis.siparisNo, takipNo)
    setKaydediliyor(false)
    setGonderildi(true)
    setTimeout(() => setGonderildi(false), 3000)
  }

  async function faturaYukle(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf') { setFaturaHata('Sadece PDF yükleyebilirsiniz'); return }
    if (file.size > 10 * 1024 * 1024)    { setFaturaHata('Dosya en fazla 10 MB olabilir'); return }
    setFaturaHata('')
    setFaturaYukleniyor(true)
    try {
      const fd = new FormData()
      fd.append('pdf', file)
      const res = await fetch(`/api/admin/orders/${siparis.siparisNo}/fatura-pdf`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setFaturaHata(data.error || 'Yükleme başarısız'); return }
      onFaturaDegisti?.(siparis.siparisNo, { pdfPath: data.pdfPath, yuklemeTarihi: new Date().toISOString() })
    } catch {
      setFaturaHata('Bağlantı hatası')
    } finally {
      setFaturaYukleniyor(false)
    }
  }

  async function faturaGoruntule(yazdir = false) {
    setFaturaHata('')
    try {
      const res = await fetch(`/api/admin/orders/${siparis.siparisNo}/fatura-pdf`)
      const data = await res.json()
      if (!res.ok || !data.url) { setFaturaHata(data.error || 'Açılamadı'); return }
      if (yazdir) {
        // Yeni pencerede aç, yüklendikten sonra yazdırma diyaloğunu tetikle
        const win = window.open(data.url, '_blank')
        if (win) {
          win.addEventListener('load', () => { try { win.print() } catch {} })
          // Bazı tarayıcılarda load event PDF için tetiklenmez — fallback
          setTimeout(() => { try { win.print() } catch {} }, 1500)
        }
      } else {
        window.open(data.url, '_blank', 'noopener,noreferrer')
      }
    } catch {
      setFaturaHata('Bağlantı hatası')
    }
  }

  function kargoEtiketiYazdir() {
    const no = siparis.kargoTakipNo
    if (!no) return
    const m = siparis.musteri || {}
    const t = siparis.teslimat || {}
    const takipUrl = `https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code=${encodeURIComponent(no)}`
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
    // Barkod görselliği için CSS çizgileri (okunabilirliği sadece görseldir; numara metin olarak altta)
    const bars = Array.from({ length: 60 }, () => {
      const w = [1, 1, 2, 2, 3][Math.floor(Math.random() * 5)]
      return `<span style="display:inline-block;width:${w}px;height:58px;background:#000;margin-right:1.5px"></span>`
    }).join('')

    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>Kargo Etiketi — ${esc(siparis.siparisNo)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111;padding:20px;background:#fff}
  .label{max-width:560px;margin:0 auto;border:2px solid #000;border-radius:6px;overflow:hidden}
  .hdr{background:#000;color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center}
  .hdr h1{font-size:18px;letter-spacing:2px}
  .hdr span{font-size:12px;opacity:.7}
  .row{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #000}
  .cell{padding:14px 20px}
  .cell+.cell{border-left:1px solid #000}
  .label-key{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#666;margin-bottom:6px;font-weight:700}
  .cell p{font-size:13px;line-height:1.5}
  .cell p.name{font-weight:700;font-size:15px;margin-bottom:4px}
  .takip{padding:24px 20px;text-align:center;background:#fafafa}
  .takip .label-key{margin-bottom:10px}
  .barcode{white-space:nowrap;margin:0 auto 10px;display:inline-flex;align-items:end}
  .no{font-size:22px;font-weight:800;letter-spacing:4px;font-family:'Courier New',monospace}
  .footer{padding:14px 20px;border-top:1px solid #000;font-size:11px;color:#666;display:flex;justify-content:space-between;align-items:center}
  .footer strong{color:#111}
  @media print{
    @page{margin:10mm;size:A6 landscape}
    body{padding:0}
    .label{border:2px solid #000;max-width:none}
  }
</style></head><body>
<div class="label">
  <div class="hdr">
    <h1>YURTİÇİ KARGO</h1>
    <span>GAMZELİECZANEM</span>
  </div>
  <div class="row">
    <div class="cell">
      <div class="label-key">Gönderici</div>
      <p class="name">GAMZELİECZANEM</p>
      <p>Yeni Çiftlik, Kazım Karabekir Cd. No:12</p>
      <p>41650 Gölcük / Kocaeli</p>
      <p style="margin-top:4px;color:#666">0262 412 6928</p>
    </div>
    <div class="cell">
      <div class="label-key">Alıcı</div>
      <p class="name">${esc(m.adSoyad)}</p>
      <p>${esc(t.adres).replace(/\n/g, '<br>')}</p>
      <p>${esc(t.ilce)} / ${esc(t.sehir)} ${esc(t.postaKodu)}</p>
      <p style="margin-top:4px;color:#666">${esc(m.telefon)}</p>
    </div>
  </div>
  <div class="takip">
    <div class="label-key">Kargo Takip Numarası</div>
    <div class="barcode">${bars}</div>
    <div class="no">${esc(no)}</div>
  </div>
  <div class="footer">
    <span>Sipariş: <strong>${esc(siparis.siparisNo)}</strong></span>
    <span>${new Date(siparis.tarih).toLocaleDateString('tr-TR')}</span>
  </div>
</div>
<p style="text-align:center;margin-top:14px;font-size:11px;color:#999">Takip: ${takipUrl}</p>
<script>window.addEventListener('load',()=>{setTimeout(()=>window.print(),300)});</script>
</body></html>`

    const win = window.open('', '_blank')
    if (!win) return
    win.document.open()
    win.document.write(html)
    win.document.close()
  }

  async function faturaSil() {
    const ok = await askConfirm('Yüklü fatura PDF\'i silinecek. Bu işlem geri alınamaz.', {
      title: 'Faturayı sil',
      confirmLabel: 'Sil',
      danger: true,
    })
    if (!ok) return
    setFaturaHata('')
    setFaturaYukleniyor(true)
    try {
      const res = await fetch(`/api/admin/orders/${siparis.siparisNo}/fatura-pdf`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setFaturaHata(data.error || 'Silinemedi'); return }
      onFaturaDegisti?.(siparis.siparisNo, { pdfPath: null, yuklemeTarihi: null })
    } finally {
      setFaturaYukleniyor(false)
    }
  }

  return (
    <div className="bg-stone-50 border-t border-stone-100 px-4 py-5 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
      {/* Müşteri */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Müşteri</p>
        <p className="text-stone-700 font-medium">{siparis.musteri.adSoyad}</p>
        <p className="text-stone-500">{siparis.musteri.email}</p>
        <p className="text-stone-500">{siparis.musteri.telefon}</p>

        {/* Fatura Bilgileri — her siparişte görünür; yoksa "Girilmedi" notu */}
        <div className="mt-4 pt-3 border-t border-stone-200">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Fatura</p>
            {siparis.teslimat?.fatura?.tip === 'kurumsal' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">🏢 KURUMSAL</span>
            )}
            {siparis.teslimat?.fatura?.tip === 'bireysel' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">👤 BİREYSEL</span>
            )}
            {!siparis.teslimat?.fatura?.tip && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">GİRİLMEDİ</span>
            )}
          </div>

          {!siparis.teslimat?.fatura?.tip ? (
            <p className="text-xs text-stone-400 italic">
              Bu sipariş için fatura bilgisi girilmemiş.
            </p>
          ) : siparis.teslimat.fatura.tip === 'kurumsal' ? (
            <div className="space-y-0.5 text-xs">
              <p className="text-stone-700 font-medium">{siparis.teslimat.fatura.firmaUnvani}</p>
              <p className="text-stone-500">
                <span className="text-stone-400">V.D:</span> {siparis.teslimat.fatura.vergiDairesi}
              </p>
              <p className="text-stone-500 font-mono">
                <span className="text-stone-400 font-sans">V.No:</span> {siparis.teslimat.fatura.vergiNo}
              </p>
            </div>
          ) : (
            <p className="text-xs text-stone-500 font-mono">
              {siparis.teslimat.fatura.tckn
                ? <><span className="text-stone-400 font-sans">TCKN:</span> {siparis.teslimat.fatura.tckn}</>
                : <span className="text-stone-400 italic font-sans">TCKN girilmedi</span>}
            </p>
          )}

          {siparis.teslimat?.fatura?.ayniAdres === false && siparis.teslimat.fatura.adres && (
            <div className="mt-2 pt-2 border-t border-stone-100">
              <p className="text-[10px] font-semibold text-stone-400 uppercase mb-1">Fatura Adresi</p>
              <p className="text-xs text-stone-500 leading-relaxed">
                {siparis.teslimat.fatura.adres}<br />
                {siparis.teslimat.fatura.ilce} / {siparis.teslimat.fatura.sehir} {siparis.teslimat.fatura.postaKodu}
              </p>
            </div>
          )}

          {confirmEl}

          {/* Fatura işlemleri */}
          <div className="mt-3 space-y-2">
            {!faturaPdfPath ? (
              <>
                <a
                  href="https://trendyolefaturam.com/portal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-semibold rounded-lg hover:shadow-md hover:shadow-orange-200 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  1. E-Fatura Kes (Trendyol)
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
                <label className={`flex items-center justify-center gap-1.5 w-full px-3 py-2 border-2 border-dashed rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  faturaYukleniyor
                    ? 'border-stone-200 text-stone-400 cursor-wait'
                    : 'border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-400'
                }`}>
                  {faturaYukleniyor ? (
                    <>
                      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Yükleniyor...
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      2. Fatura PDF'i Yükle
                    </>
                  )}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={faturaYukle}
                    disabled={faturaYukleniyor}
                  />
                </label>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-800">Fatura yüklendi</p>
                    {siparis.teslimat?.fatura?.yuklemeTarihi && (
                      <p className="text-[10px] text-emerald-600">
                        {new Date(siparis.teslimat.fatura.yuklemeTarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => faturaGoruntule(false)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    Görüntüle
                  </button>
                  <button
                    type="button"
                    onClick={() => faturaGoruntule(true)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    Yazdır
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] text-stone-500 hover:text-stone-700 cursor-pointer underline decoration-dotted">
                    Yeni PDF ile değiştir
                    <input type="file" accept="application/pdf" className="hidden" onChange={faturaYukle} disabled={faturaYukleniyor} />
                  </label>
                  <button
                    type="button"
                    onClick={faturaSil}
                    disabled={faturaYukleniyor}
                    className="text-[11px] text-stone-400 hover:text-red-500 transition-colors"
                  >
                    Sil
                  </button>
                </div>
              </>
            )}

            {faturaHata && (
              <p className="text-xs text-red-500 px-1">{faturaHata}</p>
            )}
          </div>
        </div>
      </div>
      {/* Teslimat */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Teslimat Adresi</p>
        <p className="text-stone-600 leading-relaxed">
          {siparis.teslimat.adres}<br />
          {siparis.teslimat.ilce} / {siparis.teslimat.sehir} {siparis.teslimat.postaKodu}
        </p>
        {/* Kargo takip no */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Yurtiçi Kargo Takip No</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={takipNo}
              onChange={(e) => setTakipNo(e.target.value)}
              placeholder="Takip numarası"
              className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-rose-400"
            />
            <button
              onClick={handleKaydet}
              disabled={kaydediliyor || !takipNo.trim()}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                gonderildi ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40'
              }`}
            >
              {kaydediliyor ? '...' : gonderildi ? '✓ Gönderildi' : 'Kaydet & Bildir'}
            </button>
          </div>
          {siparis.kargoTakipNo && (
            <button
              type="button"
              onClick={kargoEtiketiYazdir}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Kargo Etiketi Yazdır
            </button>
          )}
        </div>
      </div>
      {/* Ürünler */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Ürünler</p>
        <ul className="space-y-1">
          {siparis.urunler.map((u, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="text-stone-600 truncate flex-1">{u.ad}</span>
              <span className="text-stone-400 shrink-0">×{u.adet}</span>
              <span className="text-stone-700 font-medium shrink-0">{(u.fiyat * u.adet).toLocaleString('tr-TR')} ₺</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StokYonetimi({ adminUrunler = [] }) {
  const [stoklar, setStoklar] = useState({})
  const [yukleniyor, setYukleniyor] = useState(true)
  const [guncelleniyor, setGuncelleniyor] = useState(null)
  const [stokArama, setStokArama] = useState('')
  const { refreshStok } = useStock()

  useEffect(() => {
    fetch('/api/stock').then(r => r.json()).then(setStoklar).finally(() => setYukleniyor(false))
  }, [])

  async function stokGuncelle(urunId, yeniStok) {
    setGuncelleniyor(urunId)
    await fetch('/api/stock', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urunId, stok: yeniStok }),
    })
    setStoklar((prev) => ({ ...prev, [String(urunId)]: Math.max(0, yeniStok) }))
    refreshStok()
    setGuncelleniyor(null)
  }

  const filtreliUrunler = useMemo(() => {
    const q = stokArama.toLowerCase()
    return adminUrunler.filter((u) => !q || u.ad.toLowerCase().includes(q))
  }, [stokArama, adminUrunler])

  if (yukleniyor) return <div className="py-10 flex justify-center"><div className="animate-spin w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full" /></div>

  const dusukStokSayisi = adminUrunler.filter((u) => {
    const s = stoklar[String(u.id)] ?? 0
    return s > 0 && s < 5
  }).length
  const stokTukendiSayisi = adminUrunler.filter((u) => (stoklar[String(u.id)] ?? 0) === 0).length

  return (
    <div className="space-y-4">
      {/* Özet */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{adminUrunler.length - stokTukendiSayisi - dusukStokSayisi}</p>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">Yeterli Stok</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{dusukStokSayisi}</p>
          <p className="text-xs text-amber-600 font-medium mt-0.5">Düşük Stok (&lt;5)</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stokTukendiSayisi}</p>
          <p className="text-xs text-red-500 font-medium mt-0.5">Stok Tükendi</p>
        </div>
      </div>

      {/* Arama */}
      <input
        type="text"
        placeholder="Ürün ara..."
        value={stokArama}
        onChange={(e) => setStokArama(e.target.value)}
        className="w-full sm:w-72 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
      />

      {/* Tablo */}
      <div className="overflow-x-auto rounded-xl border border-stone-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Ürün</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider w-32">Stok</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider w-40">Güncelle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtreliUrunler.map((urun) => {
              const stok = stoklar[String(urun.id)] ?? 0
              const dusuk = stok > 0 && stok < 5
              const tukendi = stok === 0
              return (
                <tr key={urun.id} className={tukendi ? 'bg-red-50/50' : dusuk ? 'bg-amber-50/50' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800 line-clamp-1">{urun.ad}</p>
                    <p className="text-xs text-stone-400">
                      #{urun.id}
                      {urun.skt && <span className="ml-2">• SKT {urun.skt}</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${tukendi ? 'bg-red-100 text-red-600' : dusuk ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {tukendi ? 'Tükendi' : `${stok} adet`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => stokGuncelle(urun.id, stok - 1)}
                        disabled={stok === 0 || guncelleniyor === urun.id}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-stone-600"
                      >−</button>
                      <span className="w-10 text-center font-semibold text-stone-800">{stok}</span>
                      <button
                        onClick={() => stokGuncelle(urun.id, stok + 1)}
                        disabled={guncelleniyor === urun.id}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-stone-600"
                      >+</button>
                      <input
                        type="number"
                        min="0"
                        defaultValue={stok}
                        key={stok}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value)
                          if (!isNaN(val) && val !== stok) stokGuncelle(urun.id, val)
                        }}
                        className="w-16 px-2 py-1 border border-stone-200 rounded-lg text-center text-sm focus:outline-none focus:border-rose-400 transition-all"
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const KATEGORI_ADLARI = {
  'cilt-bakimi': 'Cilt Bakımı',
  makyaj: 'Makyaj',
  parfum: 'Parfüm',
  'sac-bakimi': 'Saç Bakımı',
  'gunes-bakimi': 'Güneş Koruyucu',
  'anne-bebek': 'Anne & Bebek',
}

function BarChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.gelir), 1)
  const cols = data.length
  const barW = Math.max(4, Math.floor(600 / cols) - 2)
  const totalW = cols * (barW + 2)
  const H = 140

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${H + 24}`} className="w-full" style={{ minWidth: Math.min(totalW, 300) }}>
        {data.map((d, i) => {
          const barH = d.gelir > 0 ? Math.max(4, (d.gelir / maxVal) * H) : 0
          const x = i * (barW + 2)
          const showLabel = cols <= 14 || i % Math.ceil(cols / 14) === 0
          return (
            <g key={i}>
              <rect x={x} y={H - barH} width={barW} height={barH} fill={barH > 0 ? '#f43f5e' : '#fce7f3'} rx={2} />
              {showLabel && (
                <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={8} fill="#a8a29e">
                  {d.tarih.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                </text>
              )}
              {d.gelir > 0 && (
                <title>{d.tarih.toLocaleDateString('tr-TR')}: {d.gelir.toLocaleString('tr-TR')} ₺</title>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function RaporlarSekme({ siparisler, adminUrunler = [] }) {
  const [aralik, setAralik] = useState('30')

  const filtreliSiparisler = useMemo(() => {
    const gun = aralik === 'bugun' ? 0 : parseInt(aralik)
    const baslangic = new Date()
    baslangic.setDate(baslangic.getDate() - gun)
    baslangic.setHours(0, 0, 0, 0)
    return siparisler.filter((s) => new Date(s.tarih) >= baslangic)
  }, [siparisler, aralik])

  const gunlukGelir = useMemo(() => {
    const gun = aralik === 'bugun' ? 1 : parseInt(aralik)
    return Array.from({ length: gun }, (_, i) => {
      const tarih = new Date()
      tarih.setDate(tarih.getDate() - (gun - 1 - i))
      tarih.setHours(0, 0, 0, 0)
      const tarihStr = tarih.toDateString()
      const gelir = filtreliSiparisler
        .filter((s) => new Date(s.tarih).toDateString() === tarihStr)
        .reduce((sum, s) => sum + s.genelToplam, 0)
      return { tarih, gelir }
    })
  }, [filtreliSiparisler, aralik])

  const enCokSatilan = useMemo(() => {
    const map = {}
    filtreliSiparisler.forEach((s) =>
      s.urunler.forEach((u) => {
        if (!map[u.id]) map[u.id] = { ad: u.ad, adet: 0, gelir: 0 }
        map[u.id].adet += u.adet
        map[u.id].gelir += u.fiyat * u.adet
      })
    )
    return Object.values(map).sort((a, b) => b.adet - a.adet).slice(0, 5)
  }, [filtreliSiparisler])

  const kategoriGelir = useMemo(() => {
    const map = {}
    filtreliSiparisler.forEach((s) =>
      s.urunler.forEach((u) => {
        const urunData = adminUrunler.find((ur) => ur.id === u.id)
        const katAd = KATEGORI_ADLARI[urunData?.kategori] ?? urunData?.kategori ?? 'Diğer'
        map[katAd] = (map[katAd] ?? 0) + u.fiyat * u.adet
      })
    )
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filtreliSiparisler])

  const durumSayilari = useMemo(() => {
    const map = {}
    filtreliSiparisler.forEach((s) => { map[s.durum] = (map[s.durum] ?? 0) + 1 })
    return map
  }, [filtreliSiparisler])

  const toplamGelir = filtreliSiparisler.reduce((s, o) => s + o.genelToplam, 0)
  const ortalamaSiparis = filtreliSiparisler.length > 0 ? toplamGelir / filtreliSiparisler.length : 0
  const maxKategoriGelir = Math.max(...kategoriGelir.map(([, v]) => v), 1)

  function exportCSV() {
    const rows = [
      ['Sipariş No', 'Tarih', 'Müşteri', 'Telefon', 'E-posta', 'Şehir', 'Ürünler', 'Ara Toplam', 'Kargo', 'Genel Toplam', 'Durum'],
      ...siparisler.map((s) => [
        s.siparisNo,
        new Date(s.tarih).toLocaleDateString('tr-TR'),
        s.musteri.adSoyad,
        s.musteri.telefon,
        s.musteri.email,
        `${s.teslimat?.ilce ?? ''} / ${s.teslimat?.sehir ?? ''}`,
        s.urunler.map((u) => `${u.ad} x${u.adet}`).join(' | '),
        s.toplamFiyat ?? '',
        s.kargoUcreti ?? 0,
        s.genelToplam,
        s.durum,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `siparisler-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ARALIK_SECENEKLER = [
    { value: 'bugun', label: 'Bugün' },
    { value: '7', label: 'Son 7 Gün' },
    { value: '30', label: 'Son 30 Gün' },
  ]

  return (
    <div className="space-y-6">
      {/* Üst bar: filtre + export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          {ARALIK_SECENEKLER.map((s) => (
            <button key={s.value} onClick={() => setAralik(s.value)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${aralik === s.value ? 'bg-rose-500 text-white shadow-sm' : 'bg-white border border-stone-200 text-stone-600 hover:border-rose-300'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-full transition-all shadow-sm">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Excel İndir (.csv)
        </button>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl mb-1">📦</p>
          <p className="text-2xl font-bold text-stone-900">{filtreliSiparisler.length}</p>
          <p className="text-sm text-stone-500 mt-0.5">Sipariş</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl mb-1">💰</p>
          <p className="text-2xl font-bold text-stone-900">{toplamGelir.toLocaleString('tr-TR')} ₺</p>
          <p className="text-sm text-stone-500 mt-0.5">Toplam Gelir</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl mb-1">🧾</p>
          <p className="text-2xl font-bold text-stone-900">{ortalamaSiparis.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</p>
          <p className="text-sm text-stone-500 mt-0.5">Ortalama Sipariş</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl mb-1">✅</p>
          <p className="text-2xl font-bold text-stone-900">{durumSayilari['Teslim Edildi'] ?? 0}</p>
          <p className="text-sm text-stone-500 mt-0.5">Teslim Edildi</p>
        </div>
      </div>

      {/* Günlük gelir grafiği */}
      <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800 mb-4">Günlük Gelir (₺)</h3>
        {toplamGelir === 0 ? (
          <div className="h-32 flex items-center justify-center text-stone-400 text-sm">Bu dönemde sipariş yok</div>
        ) : (
          <BarChart data={gunlukGelir} />
        )}
      </div>

      {/* Alt bölüm: 3 kutu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* En çok satan ürünler */}
        <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-4">En Çok Satan Ürünler</h3>
          {enCokSatilan.length === 0 ? (
            <p className="text-stone-400 text-sm">Veri yok</p>
          ) : (
            <ol className="space-y-3">
              {enCokSatilan.map((u, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-stone-300 text-stone-700' : i === 2 ? 'bg-amber-700/70 text-white' : 'bg-stone-100 text-stone-500'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{u.ad}</p>
                    <p className="text-xs text-stone-400">{u.gelir.toLocaleString('tr-TR')} ₺</p>
                  </div>
                  <span className="text-xs font-bold text-rose-600 shrink-0">{u.adet} adet</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Kategoriye göre gelir */}
        <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-4">Kategoriye Göre Gelir</h3>
          {kategoriGelir.length === 0 ? (
            <p className="text-stone-400 text-sm">Veri yok</p>
          ) : (
            <div className="space-y-3">
              {kategoriGelir.map(([kat, gelir]) => (
                <div key={kat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-stone-700">{kat}</span>
                    <span className="text-stone-500">{gelir.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div className="h-1.5 bg-rose-50 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-400 rounded-full transition-all" style={{ width: `${(gelir / maxKategoriGelir) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Durum dağılımı */}
        <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-4">Durum Dağılımı</h3>
          <div className="space-y-3">
            {[
              { durum: 'Hazırlanıyor', renk: 'bg-amber-400', ikon: '⏳' },
              { durum: 'Kargoya Verildi', renk: 'bg-blue-400', ikon: '🚚' },
              { durum: 'Teslim Edildi', renk: 'bg-emerald-400', ikon: '✅' },
              { durum: 'İptal Talebi', renk: 'bg-orange-400', ikon: '⚠️' },
              { durum: 'İptal Edildi', renk: 'bg-red-400', ikon: '❌' },
            ].map(({ durum, renk, ikon }) => {
              const sayi = durumSayilari[durum] ?? 0
              const oran = filtreliSiparisler.length > 0 ? (sayi / filtreliSiparisler.length) * 100 : 0
              return (
                <div key={durum}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-stone-700">{ikon} {durum}</span>
                    <span className="text-stone-500">{sayi} sipariş</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className={`h-full ${renk} rounded-full transition-all`} style={{ width: `${oran}%` }} />
                  </div>
                </div>
              )
            })}
            {filtreliSiparisler.length === 0 && <p className="text-stone-400 text-sm">Veri yok</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

const KATEGORILER = [
  { value: 'cilt-bakimi',   label: 'Cilt Bakımı' },
  { value: 'makyaj',        label: 'Makyaj' },
  { value: 'parfum',        label: 'Parfüm' },
  { value: 'sac-bakimi',    label: 'Saç Bakımı' },
  { value: 'gunes-bakimi',  label: 'Güneş Koruyucu' },
  { value: 'anne-bebek',    label: 'Anne & Bebek' },
]

const BOŞ_FORM = { id: '', ad: '', kategori: 'cilt-bakimi', altKategori: '', fiyat: '', eskiFiyat: '', stok: '10', aciklama: '', detay: '', ciltTipi: '', kullanim: '', rutinOnerisi: '', icerik: '', skt: '', gorsel: '', etiket: '', aktif: true }

function GorselYukle({ url, onChange }) {
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  async function dosyaSec(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setHata('')
    setYukleniyor(true)
    const fd = new FormData()
    fd.append('gorsel', file)
    const res = await fetch('/api/admin/products/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok) {
      onChange(data.url)
    } else {
      setHata(data.error || 'Yükleme başarısız')
    }
    setYukleniyor(false)
    e.target.value = ''
  }

  return (
    <div className="space-y-2">
      {url && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
          <img src={url} alt="Önizleme" className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xs transition-colors"
          >✕</button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={e => onChange(e.target.value)}
          placeholder="/uploads/products/urun.jpg veya https://..."
          className="flex-1 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
        />
        <label className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${yukleniyor ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}`}>
          {yukleniyor ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Yükleniyor
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Yükle
            </span>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={dosyaSec} disabled={yukleniyor} />
        </label>
      </div>
      {hata && <p className="text-xs text-red-500">{hata}</p>}
    </div>
  )
}

function UrunlerSekme() {
  const [urunler, setUrunler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [modal, setModal] = useState(null) // null | { mod: 'ekle' | 'duzenle', urun?: {} }
  const [form, setForm] = useState(BOŞ_FORM)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [aiDolduruyor, setAiDolduruyor] = useState(false)
  const [toplu, setToplu] = useState({ calisiyor: false, sonuc: null })
  const [siliniyor, setSiliniyor] = useState(null)
  const [hata, setHata] = useState('')
  const [arama, setArama] = useState('')
  const [askConfirm, confirmEl] = useConfirm()

  useEffect(() => {
    fetch('/api/admin/products').then(r => r.json()).then(setUrunler).finally(() => setYukleniyor(false))
  }, [])

  function aç(mod, urun) {
    setHata('')
    if (mod === 'ekle') {
      setForm(BOŞ_FORM)
    } else {
      setForm({
        id:          String(urun.id),
        ad:          urun.ad ?? '',
        kategori:    urun.kategori ?? 'cilt-bakimi',
        altKategori: urun.alt_kategori ?? '',
        fiyat:       String(urun.fiyat ?? ''),
        eskiFiyat:   String(urun.eski_fiyat ?? ''),
        stok:        String(urun.stok ?? '0'),
        aciklama:    urun.aciklama ?? '',
        detay:       urun.detay ?? '',
        ciltTipi:    urun.cilt_tipi ?? '',
        kullanim:    urun.kullanim ?? '',
        rutinOnerisi:urun.rutin_onerisi ?? '',
        icerik:      urun.icerik ?? '',
        skt:         urun.skt ?? '',
        gorsel:      urun.gorsel ?? '',
        etiket:      urun.etiket ?? '',
        aktif:       urun.aktif !== false,
      })
    }
    setModal({ mod, urun })
  }

  function kapat() { setModal(null); setHata('') }

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function kaydet(e) {
    e.preventDefault()
    setHata('')
    setKaydediyor(true)
    const payload = {
      ad: form.ad, kategori: form.kategori, altKategori: form.altKategori || null,
      fiyat: Number(form.fiyat), eskiFiyat: form.eskiFiyat ? Number(form.eskiFiyat) : null,
      stok: Number(form.stok) || 0, aciklama: form.aciklama || null, detay: form.detay || null,
      ciltTipi: form.ciltTipi || null, kullanim: form.kullanim || null, rutinOnerisi: form.rutinOnerisi || null,
      icerik: form.icerik || null,
      skt: form.skt || null,
      gorsel: form.gorsel || null, etiket: form.etiket || null, aktif: form.aktif,
    }
    try {
      let res, data
      if (modal.mod === 'ekle') {
        res = await fetch('/api/admin/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: Number(form.id) }),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Hata')
        setUrunler(p => [...p, { ...data, stok: Number(form.stok) || 0 }])
      } else {
        res = await fetch(`/api/admin/products/${modal.urun.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Hata')
        setUrunler(p => p.map(u => u.id === modal.urun.id ? { ...data, stok: Number(form.stok) || 0 } : u))
      }
      kapat()
    } catch (err) {
      setHata(err.message)
    }
    setKaydediyor(false)
  }

  async function sil(id) {
    const urun = urunler.find(u => u.id === id)
    const ok = await askConfirm(`"${urun?.ad || 'Bu ürün'}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`, {
      title: 'Ürünü sil',
      confirmLabel: 'Sil',
      danger: true,
    })
    if (!ok) return
    setSiliniyor(id)
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) setUrunler(p => p.filter(u => u.id !== id))
    setSiliniyor(null)
  }

  const filtreliUrunler = arama
    ? urunler.filter(u => u.ad?.toLowerCase().includes(arama.toLowerCase()) || String(u.id).includes(arama))
    : urunler

  async function csvIcerAktar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const text = await file.text()
    const satirlar = text.trim().split(/\r?\n/)
    const baslik = satirlar[0].split(',').map(s => s.trim().replace(/^"|"$/g, ''))
    const zorunlu = ['id', 'ad', 'kategori', 'fiyat']
    const eksik = zorunlu.filter(k => !baslik.includes(k))
    if (eksik.length > 0) {
      alert(`CSV'de eksik sütun: ${eksik.join(', ')}\n\nGerekli sütunlar: id, ad, kategori, fiyat\nOpsiyonel: eskiFiyat, stok, aciklama, detay, gorsel, etiket, aktif`)
      return
    }
    const idx = k => baslik.indexOf(k)
    const satirDizisi = satirlar.slice(1).filter(s => s.trim())
    const kayitlar = satirDizisi.map(satir => {
      const cols = satir.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
      return {
        id: Number(cols[idx('id')]),
        ad: cols[idx('ad')] || '',
        kategori: cols[idx('kategori')] || 'cilt-bakimi',
        altKategori: idx('altKategori') >= 0 ? cols[idx('altKategori')] || null : null,
        fiyat: Number(cols[idx('fiyat')]) || 0,
        eskiFiyat: idx('eskiFiyat') >= 0 && cols[idx('eskiFiyat')] ? Number(cols[idx('eskiFiyat')]) : null,
        stok: idx('stok') >= 0 ? Number(cols[idx('stok')]) || 0 : 10,
        aciklama: idx('aciklama') >= 0 ? cols[idx('aciklama')] || null : null,
        detay: idx('detay') >= 0 ? cols[idx('detay')] || null : null,
        gorsel: idx('gorsel') >= 0 ? cols[idx('gorsel')] || null : null,
        etiket: idx('etiket') >= 0 ? cols[idx('etiket')] || null : null,
        aktif: idx('aktif') >= 0 ? cols[idx('aktif')] !== 'false' : true,
      }
    }).filter(r => r.id && r.ad)

    if (kayitlar.length === 0) { alert('CSV dosyasında geçerli satır bulunamadı.'); return }
    const onay = await askConfirm(`${kayitlar.length} ürün CSV'den içe aktarılacak. Devam edilsin mi?`, {
      title: 'CSV içe aktar',
      confirmLabel: 'İçe aktar',
    })
    if (!onay) return

    let basarili = 0, hatali = 0
    for (const kayit of kayitlar) {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kayit),
      })
      if (res.ok) {
        const data = await res.json()
        setUrunler(p => [...p, { ...data, stok: kayit.stok }])
        basarili++
      } else {
        hatali++
      }
    }
    alert(`İçe aktarma tamamlandı.\n✓ ${basarili} başarılı  ✗ ${hatali} hatalı`)
  }

  function csvSablonIndir() {
    const satir = 'id,ad,kategori,altKategori,fiyat,eskiFiyat,stok,aciklama,detay,gorsel,etiket,aktif'
    const ornek = '101,Örnek Ürün,cilt-bakimi,,299.90,399.90,20,Kısa açıklama,,/uploads/products/urun.jpg,Yeni,true'
    const csv = satir + '\n' + ornek
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'urun-sablonu.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (yukleniyor) return <div className="py-10 flex justify-center"><div className="animate-spin w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full" /></div>

  return (
    <div className="space-y-4">
      {confirmEl}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <input
          type="text" placeholder="Ürün ara..."
          value={arama} onChange={e => setArama(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={csvSablonIndir}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Şablon İndir
          </button>
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            CSV İçe Aktar
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={csvIcerAktar} />
          </label>
          <button
            type="button"
            disabled={toplu.calisiyor}
            onClick={async () => {
              if (!confirm('Açıklaması eksik tüm ürünler için yapay zeka ile "Kimler için uygun / Nasıl kullanılır / Rutin önerisi" alanları doldurulacak. Devam edilsin mi?')) return
              setToplu({ calisiyor: true, sonuc: null })
              try {
                const res = await fetch('/api/admin/products/enhance', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ overwrite: false, limit: 200 }),
                })
                const d = await res.json()
                setToplu({ calisiyor: false, sonuc: d })
                // Ürün listesini tazele
                const upd = await fetch('/api/admin/products').then(r => r.json())
                setUrunler(upd)
              } catch (e) {
                setToplu({ calisiyor: false, sonuc: { hata: true, mesaj: e.message } })
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50 rounded-xl transition-all"
          >
            <span aria-hidden>✨</span>
            {toplu.calisiyor ? 'Üretiliyor...' : 'Eksikleri Yapay Zeka ile Doldur'}
          </button>
          <button
            onClick={() => aç('ekle')}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {toplu.sonuc && (
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-sm text-purple-800 flex items-center justify-between gap-3">
          <span>
            {toplu.sonuc.hata
              ? `Hata: ${toplu.sonuc.mesaj}`
              : `AI doldurma tamamlandı — ${toplu.sonuc.tamam} başarılı, ${toplu.sonuc.hata} hatalı, ${toplu.sonuc.atlanan} atlandı (zaten doluydu).`}
          </span>
          <button onClick={() => setToplu({ calisiyor: false, sonuc: null })} className="text-purple-500 hover:text-purple-700 text-lg leading-none">×</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-stone-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider w-12">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Ürün Adı</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Kategori</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">Fiyat</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Stok</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Durum</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider w-28">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtreliUrunler.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-stone-400">Ürün bulunamadı</td></tr>
            )}
            {filtreliUrunler.map(urun => (
              <tr key={urun.id} className={!urun.aktif ? 'opacity-50' : ''}>
                <td className="px-4 py-3 text-xs text-stone-400 font-mono">{urun.id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-800 line-clamp-1">{urun.ad}</p>
                  {urun.etiket && <span className="text-xs text-rose-500 font-medium">{urun.etiket}</span>}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-stone-500">{KATEGORILER.find(k => k.value === urun.kategori)?.label ?? urun.kategori}</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-stone-800">
                  {Number(urun.fiyat).toLocaleString('tr-TR')} ₺
                  {urun.eski_fiyat && <p className="text-xs text-stone-400 line-through">{Number(urun.eski_fiyat).toLocaleString('tr-TR')} ₺</p>}
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(urun.stok ?? 0) === 0 ? 'bg-red-100 text-red-600' : (urun.stok ?? 0) < 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {urun.stok ?? 0}
                  </span>
                  {urun.skt && <p className="text-[10px] text-stone-400 mt-1">SKT {urun.skt}</p>}
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urun.aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                    {urun.aktif ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => aç('duzenle', urun)}
                      className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                    >Düzenle</button>
                    <button
                      onClick={() => sil(urun.id)}
                      disabled={siliniyor === urun.id}
                      className="px-2.5 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                    >Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-stone-900">{modal.mod === 'ekle' ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}</h3>
              <button onClick={kapat} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 transition-colors">✕</button>
            </div>
            <form onSubmit={kaydet} className="p-6 space-y-4">
              {hata && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{hata}</p>}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">ID <span className="text-red-400">*</span></label>
                  <input type="number" required value={form.id} onChange={e => set('id', e.target.value)}
                    disabled={modal.mod === 'duzenle'}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all disabled:bg-stone-50 disabled:text-stone-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Stok</label>
                  <input type="number" min="0" value={form.stok} onChange={e => set('stok', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">SKT <span className="text-stone-400 font-normal">(MM/YYYY)</span></label>
                  <input type="text" inputMode="numeric" pattern="(0[1-9]|1[0-2])/\d{4}" placeholder="06/2027"
                    value={form.skt} onChange={e => set('skt', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Ürün Adı <span className="text-red-400">*</span></label>
                <input type="text" required value={form.ad} onChange={e => set('ad', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Kategori <span className="text-red-400">*</span></label>
                  <select value={form.kategori} onChange={e => set('kategori', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all bg-white">
                    {KATEGORILER.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Alt Kategori</label>
                  <input type="text" value={form.altKategori} onChange={e => set('altKategori', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Fiyat (₺) <span className="text-red-400">*</span></label>
                  <input type="number" min="0" step="0.01" required value={form.fiyat} onChange={e => set('fiyat', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Eski Fiyat (₺)</label>
                  <input type="number" min="0" step="0.01" value={form.eskiFiyat} onChange={e => set('eskiFiyat', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Görsel</label>
                <GorselYukle url={form.gorsel} onChange={url => set('gorsel', url)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Etiket</label>
                  <input type="text" value={form.etiket} onChange={e => set('etiket', e.target.value)} placeholder="Yeni, Çok Satan..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.aktif} onChange={e => set('aktif', e.target.checked)}
                      className="w-4 h-4 accent-rose-500" />
                    <span className="text-sm font-medium text-stone-700">Aktif</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Kısa Açıklama</label>
                <textarea rows={2} value={form.aciklama} onChange={e => set('aciklama', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Detay (uzun açıklama)</label>
                <textarea rows={3} value={form.detay} onChange={e => set('detay', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none" />
              </div>

              {/* Yapılandırılmış açıklama alanları */}
              <div className="pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-stone-700">Yapılandırılmış Açıklama</h4>
                  {modal.mod === 'duzenle' && modal.urun?.id && (
                    <button
                      type="button"
                      disabled={aiDolduruyor}
                      onClick={async () => {
                        setAiDolduruyor(true)
                        try {
                          const res = await fetch('/api/admin/products/enhance', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ids: [modal.urun.id], overwrite: true }),
                          })
                          const d = await res.json()
                          if (!res.ok || d.hata > 0) {
                            alert('AI doldurma başarısız: ' + (d.detay?.[0]?.hata || d.error || 'Bilinmeyen hata'))
                          } else {
                            // Güncel değerleri çek
                            const upd = await fetch(`/api/admin/products`).then(r => r.json())
                            const yeni = upd.find(u => u.id === modal.urun.id)
                            if (yeni) {
                              set('ciltTipi', yeni.cilt_tipi ?? '')
                              set('kullanim', yeni.kullanim ?? '')
                              set('rutinOnerisi', yeni.rutin_onerisi ?? '')
                            }
                          }
                        } catch (e) {
                          alert('Hata: ' + e.message)
                        } finally {
                          setAiDolduruyor(false)
                        }
                      }}
                      className="px-3 py-1 text-xs font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 disabled:opacity-50 transition-colors"
                    >
                      {aiDolduruyor ? 'Üretiliyor...' : '✨ Yapay Zeka ile Doldur'}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Kimler İçin Uygun (cilt/saç tipi)</label>
                    <textarea rows={2} value={form.ciltTipi} onChange={e => set('ciltTipi', e.target.value)}
                      placeholder="Örn: Yağlı ve karma ciltler için. Akne sorunu yaşayanlara uygundur."
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Nasıl Kullanılır</label>
                    <textarea rows={3} value={form.kullanim} onChange={e => set('kullanim', e.target.value)}
                      placeholder="Adım adım kullanım talimatı..."
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Rutin Önerisi (kombinasyon)</label>
                    <textarea rows={3} value={form.rutinOnerisi} onChange={e => set('rutinOnerisi', e.target.value)}
                      placeholder="Temizleyici → tonik → bu ürün → nemlendirici → SPF..."
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      İçindekiler (INCI)
                      <span className="ml-2 text-[10px] text-stone-400 font-normal">Virgülle ayırın — ambalajdaki sıraya göre</span>
                    </label>
                    <textarea rows={4} value={form.icerik} onChange={e => set('icerik', e.target.value)}
                      placeholder="Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Panthenol, Tocopherol, Phenoxyethanol, ..."
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={kapat}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-all">
                  İptal
                </button>
                <button type="submit" disabled={kaydediyor}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-stone-300 text-white text-sm font-semibold rounded-xl transition-all">
                  {kaydediyor ? 'Kaydediliyor...' : modal.mod === 'ekle' ? 'Ekle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MesajlarSekme({ mesajlar, setMesajlar }) {
  const [acikId, setAcikId] = useState(null)
  const [cevap, setCevap] = useState('')
  const [gonderiyor, setGonderiyor] = useState(false)
  const [filtre, setFiltre] = useState('hepsi') // hepsi | okunmamis | cevaplandi
  const [askConfirm, confirmEl] = useConfirm()

  const filtrelenmis = mesajlar.filter(m => {
    if (filtre === 'okunmamis') return !m.okundu
    if (filtre === 'cevaplandi') return !!m.cevap
    return true
  })

  async function okunduIsaretle(id) {
    await fetch('/api/admin/mesajlar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'okundu' }),
    })
    setMesajlar(prev => prev.map(m => m.id === id ? { ...m, okundu: true } : m))
  }

  async function cevapla(id) {
    if (!cevap.trim()) return
    setGonderiyor(true)
    await fetch('/api/admin/mesajlar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'cevapla', cevap }),
    })
    setMesajlar(prev => prev.map(m => m.id === id ? { ...m, cevap, cevap_tarihi: new Date().toISOString(), okundu: true } : m))
    setCevap('')
    setGonderiyor(false)
  }

  async function sil(id) {
    const ok = await askConfirm('Bu mesaj kalıcı olarak silinecek. Bu işlem geri alınamaz.', {
      title: 'Mesajı sil',
      confirmLabel: 'Sil',
      danger: true,
    })
    if (!ok) return
    await fetch('/api/admin/mesajlar', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMesajlar(prev => prev.filter(m => m.id !== id))
    if (acikId === id) setAcikId(null)
  }

  return (
    <div className="space-y-4">
      {confirmEl}
      {/* Filtre */}
      <div className="flex gap-2">
        {[
          { value: 'hepsi', label: `Tümü (${mesajlar.length})` },
          { value: 'okunmamis', label: `Okunmamış (${mesajlar.filter(m => !m.okundu).length})` },
          { value: 'cevaplandi', label: `Cevaplanan (${mesajlar.filter(m => m.cevap).length})` },
        ].map(f => (
          <button key={f.value} onClick={() => setFiltre(f.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${filtre === f.value ? 'bg-rose-500 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-rose-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
        {filtrelenmis.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-400 text-sm">📭 Mesaj bulunamadı</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filtrelenmis.map(m => (
              <div key={m.id} className={`${!m.okundu ? 'bg-rose-50/40' : ''}`}>
                <div
                  className="px-6 py-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
                  onClick={() => { setAcikId(acikId === m.id ? null : m.id); if (!m.okundu) okunduIsaretle(m.id) }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {!m.okundu && <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />}
                        <span className="text-sm font-semibold text-stone-800">{m.ad}</span>
                        <span className="text-xs text-stone-400">{m.email}</span>
                        {m.siparis_no && <span className="text-xs font-mono text-rose-500">{m.siparis_no}</span>}
                        {m.cevap && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Cevaplandı</span>}
                      </div>
                      <p className="text-sm font-medium text-stone-700">{m.konu}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{new Date(m.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); sil(m.id) }} className="text-stone-300 hover:text-red-500 transition-colors p-1 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {acikId === m.id && (
                  <div className="px-6 pb-5 bg-stone-50/50 border-t border-stone-100">
                    <p className="text-sm text-stone-700 mt-4 leading-relaxed whitespace-pre-wrap">{m.mesaj}</p>
                    {m.cevap && (
                      <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <p className="text-xs font-semibold text-emerald-600 mb-1">Cevabınız · {m.cevap_tarihi ? new Date(m.cevap_tarihi).toLocaleDateString('tr-TR') : ''}</p>
                        <p className="text-sm text-stone-700 whitespace-pre-wrap">{m.cevap}</p>
                      </div>
                    )}
                    {!m.cevap && (
                      <div className="mt-4">
                        <textarea
                          value={cevap}
                          onChange={e => setCevap(e.target.value)}
                          placeholder="Cevabınızı yazın... (müşteriye e-posta ile gönderilecek)"
                          rows={3}
                          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none"
                        />
                        <button
                          onClick={() => cevapla(m.id)}
                          disabled={gonderiyor || !cevap.trim()}
                          className="mt-2 px-4 py-2 bg-rose-500 text-white text-xs font-semibold rounded-lg hover:bg-rose-600 disabled:opacity-40 transition-all"
                        >
                          {gonderiyor ? 'Gönderiliyor...' : 'Cevapla'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BildirimlerSekme({ gecikenSiparisler, okunmamisMesajlar, iadeler, adminUrunler, onSekmeGit }) {
  const bekleyenIade = iadeler.filter(i => i.durum === 'Beklemede')

  // Görselsiz veya açıklamasız ürünler
  const eksikIcerikliUrunler = adminUrunler.filter(u => !u.gorsel || !u.aciklama)

  const bildirimler = [
    ...gecikenSiparisler.map(s => ({
      tip: 'geciken',
      renk: 'bg-red-50 border-red-200',
      ikonRenk: 'bg-red-100 text-red-600',
      ikon: '⏰',
      baslik: `${s.siparisNo} siparişi gecikiyor`,
      aciklama: `${s.musteri.adSoyad} — ${Math.floor((Date.now() - new Date(s.tarih).getTime()) / 3600000)} saattir kargoya verilmedi`,
      buton: 'Siparişe Git',
      sekme: 'siparisler',
    })),
    ...bekleyenIade.map(i => ({
      tip: 'iade',
      renk: 'bg-orange-50 border-orange-200',
      ikonRenk: 'bg-orange-100 text-orange-600',
      ikon: '↩️',
      baslik: `${i.siparis_no} için iade talebi`,
      aciklama: `${i.musteri_ad} — ${i.neden}`,
      buton: 'İadelere Git',
      sekme: 'iadeler',
    })),
    ...okunmamisMesajlar.map(m => ({
      tip: 'mesaj',
      renk: 'bg-rose-50 border-rose-200',
      ikonRenk: 'bg-rose-100 text-rose-600',
      ikon: '✉️',
      baslik: `${m.ad} — ${m.konu}`,
      aciklama: m.mesaj.substring(0, 80) + (m.mesaj.length > 80 ? '...' : ''),
      buton: 'Mesajlara Git',
      sekme: 'mesajlar',
    })),
    ...eksikIcerikliUrunler.map(u => ({
      tip: 'eksik',
      renk: 'bg-amber-50 border-amber-200',
      ikonRenk: 'bg-amber-100 text-amber-600',
      ikon: '⚠️',
      baslik: `"${u.ad}" ürününde eksik içerik`,
      aciklama: [!u.gorsel && 'Görsel yok', !u.aciklama && 'Açıklama yok'].filter(Boolean).join(', '),
      buton: 'Ürünlere Git',
      sekme: 'urunler',
    })),
  ]

  return (
    <div className="space-y-4">
      {/* Özet kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-2xl border p-4 ${gecikenSiparisler.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-stone-100'}`}>
          <p className={`text-2xl font-bold ${gecikenSiparisler.length > 0 ? 'text-red-600' : 'text-stone-400'}`}>{gecikenSiparisler.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Geciken Sipariş</p>
        </div>
        <div className={`rounded-2xl border p-4 ${okunmamisMesajlar.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-stone-100'}`}>
          <p className={`text-2xl font-bold ${okunmamisMesajlar.length > 0 ? 'text-rose-600' : 'text-stone-400'}`}>{okunmamisMesajlar.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Okunmamış Mesaj</p>
        </div>
        <div className={`rounded-2xl border p-4 ${bekleyenIade.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-stone-100'}`}>
          <p className={`text-2xl font-bold ${bekleyenIade.length > 0 ? 'text-orange-600' : 'text-stone-400'}`}>{bekleyenIade.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Bekleyen İade</p>
        </div>
        <div className={`rounded-2xl border p-4 ${eksikIcerikliUrunler.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-100'}`}>
          <p className={`text-2xl font-bold ${eksikIcerikliUrunler.length > 0 ? 'text-amber-600' : 'text-stone-400'}`}>{eksikIcerikliUrunler.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Eksik İçerik</p>
        </div>
      </div>

      {/* Bildirim listesi */}
      {bildirimler.length === 0 ? (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm px-6 py-16 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm font-semibold text-stone-600">Her şey yolunda!</p>
          <p className="text-xs text-stone-400 mt-1">Bekleyen aksiyon yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bildirimler.map((b, i) => (
            <div key={i} className={`rounded-2xl border ${b.renk} p-4 flex items-start gap-4`}>
              <div className={`w-10 h-10 rounded-xl ${b.ikonRenk} flex items-center justify-center text-lg shrink-0`}>{b.ikon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800">{b.baslik}</p>
                <p className="text-xs text-stone-500 mt-0.5">{b.aciklama}</p>
              </div>
              <button
                onClick={() => onSekmeGit(b.sekme)}
                className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-white border border-stone-200 text-stone-600 rounded-lg hover:border-rose-300 hover:text-rose-600 transition-all"
              >
                {b.buton}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Eksik içerikli ürünler detay */}
      {eksikIcerikliUrunler.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-800">⚠️ Eksik İçerikli Ürünler</h3>
            <p className="text-xs text-stone-400 mt-0.5">Bu ürünlerin görsel veya açıklaması eksik — satışı olumsuz etkiler</p>
          </div>
          <div className="divide-y divide-stone-100">
            {eksikIcerikliUrunler.slice(0, 10).map(u => (
              <div key={u.id} className="px-6 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                  {u.gorsel ? <img src={u.gorsel} className="w-full h-full object-cover rounded-lg" alt="" /> : <span className="text-stone-400 text-xs">📷</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{u.ad}</p>
                  <p className="text-xs text-amber-600">
                    {[!u.gorsel && '❌ Görsel', !u.aciklama && '❌ Açıklama'].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button
                  onClick={() => onSekmeGit('urunler')}
                  className="text-xs text-rose-600 hover:underline font-medium shrink-0"
                >Düzenle →</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MusterilerSekme({ musteriler }) {
  const [arama, setArama] = useState('')
  const [siralama, setSiralama] = useState('yeni') // yeni | harcama | siparis

  const filtrelenmis = useMemo(() => {
    const q = arama.toLowerCase()
    let liste = q
      ? musteriler.filter(m => m.ad?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q))
      : [...musteriler]
    if (siralama === 'harcama') liste.sort((a, b) => b.toplamHarcama - a.toplamHarcama)
    else if (siralama === 'siparis') liste.sort((a, b) => b.siparisSayisi - a.siparisSayisi)
    else liste.sort((a, b) => new Date(b.kayitTarihi) - new Date(a.kayitTarihi))
    return liste
  }, [musteriler, arama, siralama])

  const toplamHarcama = musteriler.reduce((s, m) => s + m.toplamHarcama, 0)
  const aktifMusteriler = musteriler.filter(m => m.siparisSayisi > 0).length

  return (
    <div className="space-y-4">
      {/* Özet */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl font-bold text-stone-900">{musteriler.length}</p>
          <p className="text-sm text-stone-500 mt-0.5">Toplam Üye</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl font-bold text-stone-900">{aktifMusteriler}</p>
          <p className="text-sm text-stone-500 mt-0.5">Sipariş Veren</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl font-bold text-stone-900">{toplamHarcama.toLocaleString('tr-TR')} ₺</p>
          <p className="text-sm text-stone-500 mt-0.5">Toplam Harcama</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          type="text"
          placeholder="İsim veya e-posta ara..."
          value={arama}
          onChange={e => setArama(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
        />
        <div className="flex gap-2">
          {[
            { value: 'yeni', label: 'En Yeni' },
            { value: 'harcama', label: 'En Çok Harcayan' },
            { value: 'siparis', label: 'En Çok Sipariş' },
          ].map(s => (
            <button
              key={s.value}
              onClick={() => setSiralama(s.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${siralama === s.value ? 'bg-rose-500 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-rose-300'}`}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
        {filtrelenmis.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-400 text-sm">📭 Müşteri bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Müşteri</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">E-posta</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider">Sipariş</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">Harcama</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Üyelik</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Giriş Tipi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtrelenmis.map(m => (
                  <tr key={m.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm shrink-0">
                          {m.ad?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="font-medium text-stone-800">{m.ad}</p>
                          <p className="text-xs text-stone-400 sm:hidden">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">{m.email}</td>
                    <td className="px-4 py-3 text-center">
                      {m.siparisSayisi > 0 ? (
                        <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">{m.siparisSayisi}</span>
                      ) : (
                        <span className="text-stone-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-stone-700 hidden md:table-cell">
                      {m.toplamHarcama > 0 ? `${m.toplamHarcama.toLocaleString('tr-TR')} ₺` : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-stone-400 hidden lg:table-cell">
                      {m.kayitTarihi ? new Date(m.kayitTarihi).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {m.googleHesabi ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Google</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-medium">E-posta</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPaneli() {
  // Middleware gla_admin cookie'sini HMAC ile doğruladığı için bu sayfaya
  // yalnızca geçerli admin token'ı olan kullanıcılar ulaşabilir.
  // 'yukleniyor' → veriler yüklenirken; 'panel' → hazır
  const [ekran, setEkran] = useState('yukleniyor') // yukleniyor | panel
  const [aktifSekme, setAktifSekme] = useState('siparisler') // siparisler | stok | raporlar | urunler | yorumlar | iadeler | musteriler
  const [siparisler, setSiparisler] = useState([])
  const [adminUrunler, setAdminUrunler] = useState([])
  const [yorumlar, setYorumlar] = useState([])
  const [iadeler, setIadeler] = useState([])
  const [musteriler, setMusteriler] = useState([])
  const [mesajlar, setMesajlar] = useState([])
  const [stoklar, setStoklar] = useState({})
  const [veriYukleniyor, setVeriYukleniyor] = useState(false)
  const [acikId, setAcikId] = useState(null)
  const [arama, setArama] = useState('')
  const [kritikHepsi, setKritikHepsi] = useState(false)
  const [askConfirm, confirmEl] = useConfirm()

  const fetchOrders = useCallback(async () => {
    setVeriYukleniyor(true)
    try {
      const res = await fetch('/api/admin/orders')
      if (res.ok) setSiparisler(await res.json())
    } catch {}
    setVeriYukleniyor(false)
  }, [])

  useEffect(() => {
    fetch('/api/admin/products').then(r => r.json()).then(d => setAdminUrunler(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/reviews').then(r => r.json()).then(d => setYorumlar(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/admin/iade').then(r => r.json()).then(d => setIadeler(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/admin/users').then(r => r.json()).then(d => setMusteriler(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/admin/mesajlar').then(r => r.json()).then(d => setMesajlar(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/stock').then(r => r.json()).then(d => setStoklar(d || {})).catch(() => {})
  }, [])

  useEffect(() => {
    // Middleware zaten doğruladı; check yine de çağrılır (savunma katmanı).
    // Olası token manipülasyonunda /admin/giris'e yönlendir.
    fetch('/api/admin/check').then((r) => {
      if (r.ok) { setEkran('panel'); fetchOrders() }
      else window.location.href = '/admin/giris'
    }).catch(() => { window.location.href = '/admin/giris' })
  }, [fetchOrders])

  // 60 saniyede bir otomatik yenile (panel açıkken)
  useEffect(() => {
    if (ekran !== 'panel') return
    const interval = setInterval(() => { fetchOrders() }, 60000)
    return () => clearInterval(interval)
  }, [ekran, fetchOrders])

  async function handleLogout() {
    try { sessionStorage.removeItem('gla_admin_session') } catch {}
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin/giris'
  }

  async function durumDegistir(siparisNo, yeniDurum) {
    await fetch(`/api/admin/orders/${siparisNo}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durum: yeniDurum }),
    })
    setSiparisler((prev) =>
      prev.map((s) => s.siparisNo === siparisNo ? { ...s, durum: yeniDurum } : s)
    )
  }

  async function siparisSil(siparisNo) {
    const ok = await askConfirm(`${siparisNo} numaralı sipariş kalıcı olarak silinecek. Bu işlem geri alınamaz.`, {
      title: 'Siparişi sil',
      confirmLabel: 'Sil',
      danger: true,
    })
    if (!ok) return
    await fetch(`/api/admin/orders/${siparisNo}`, { method: 'DELETE' })
    setSiparisler((prev) => prev.filter((s) => s.siparisNo !== siparisNo))
  }

  function faturaDegisti(siparisNo, patch) {
    setSiparisler((prev) => prev.map((s) =>
      s.siparisNo === siparisNo
        ? { ...s, teslimat: { ...s.teslimat, fatura: { ...(s.teslimat?.fatura || {}), ...patch } } }
        : s
    ))
  }

  async function kargoTakipKaydet(siparisNo, kargoTakipNo) {
    if (!kargoTakipNo.trim()) return
    await fetch(`/api/admin/orders/${siparisNo}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kargoTakipNo: kargoTakipNo.trim() }),
    })
    setSiparisler((prev) =>
      prev.map((s) => s.siparisNo === siparisNo ? { ...s, durum: 'Kargoya Verildi', kargoTakipNo: kargoTakipNo.trim() } : s)
    )
  }

  // Stats
  const bugunStr = new Date().toDateString()
  const bugunSiparisler = siparisler.filter((s) => new Date(s.tarih).toDateString() === bugunStr)
  const bugunGelir = bugunSiparisler.reduce((a, s) => a + s.genelToplam, 0)
  const toplamGelir = siparisler.reduce((a, s) => a + s.genelToplam, 0)

  // Geciken siparişler (24+ saat Hazırlanıyor durumunda)
  const gecikmeEsigi = 24 * 60 * 60 * 1000
  const gecikenSiparisler = siparisler.filter(
    (s) => s.durum === 'Hazırlanıyor' && (Date.now() - new Date(s.tarih).getTime()) > gecikmeEsigi
  )

  // Okunmamış mesajlar
  const okunmamisMesajlar = mesajlar.filter(m => !m.okundu)

  // Kritik stok uyarısı (sadece son 1 adet kalanlar)
  const kritikStokUrunler = adminUrunler.filter((u) => {
    const s = stoklar[String(u.id)] ?? 0
    return s === 1
  }).map((u) => ({ ...u, stok: stoklar[String(u.id)] ?? 0 }))

  // Filtreli siparişler
  const filtreliSiparisler = siparisler.filter((s) => {
    if (!arama) return true
    const q = arama.toLowerCase()
    return (
      s.siparisNo.toLowerCase().includes(q) ||
      s.musteri.adSoyad.toLowerCase().includes(q) ||
      s.musteri.telefon.includes(q) ||
      s.musteri.email.toLowerCase().includes(q)
    )
  })

  if (ekran === 'yukleniyor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="animate-spin w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {confirmEl}
      {/* Top bar */}
      <header className="bg-white border-b border-rose-100 sticky top-0 z-30 shadow-sm">
        {/* Üst satır: logo + yenile + çıkış */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="GAMZELİECZANEM" className="w-8 h-8 rounded-lg object-contain" />
            <div>
              <p className="text-sm font-bold text-stone-900 leading-none">Admin Paneli</p>
              <p className="text-xs text-stone-400 leading-none mt-0.5">GAMZELİECZANEM</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={fetchOrders} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all">
              <svg className={`w-3.5 h-3.5 ${veriYukleniyor ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Yenile</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
        {/* Alt satır: kaydırılabilir sekmeler */}
        <div className="border-t border-stone-100 overflow-x-auto scrollbar-hide">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-1.5 min-w-max">
            <button onClick={() => setAktifSekme('siparisler')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'siparisler' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Siparişler</button>
            <button onClick={() => setAktifSekme('stok')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'stok' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Stok</button>
            <button onClick={() => setAktifSekme('raporlar')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'raporlar' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Raporlar</button>
            <button onClick={() => setAktifSekme('urunler')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'urunler' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Ürünler</button>
            <button onClick={() => setAktifSekme('yorumlar')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'yorumlar' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Yorumlar</button>
            <button onClick={() => setAktifSekme('musteriler')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'musteriler' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Müşteriler</button>
            <button onClick={() => setAktifSekme('mesajlar')} className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'mesajlar' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>
              Mesajlar
              {okunmamisMesajlar.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{okunmamisMesajlar.length}</span>
              )}
            </button>
            <button onClick={() => setAktifSekme('bildirimler')} className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'bildirimler' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>
              Bildirimler
              {(gecikenSiparisler.length + okunmamisMesajlar.length) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{gecikenSiparisler.length + okunmamisMesajlar.length}</span>
              )}
            </button>
            <button onClick={() => setAktifSekme('iadeler')} className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'iadeler' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>
              İadeler
              {iadeler.filter(i => i.durum === 'Beklemede').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {iadeler.filter(i => i.durum === 'Beklemede').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatKart ikon="📦" baslik="Bugünkü Sipariş" deger={bugunSiparisler.length} alt="Bugün" />
          <StatKart ikon="💰" baslik="Bugünkü Gelir" deger={`${bugunGelir.toLocaleString('tr-TR')} ₺`} alt="Bugün" />
          <StatKart ikon="🛒" baslik="Toplam Sipariş" deger={siparisler.length} alt="Tüm zamanlar" />
          <StatKart ikon="📈" baslik="Toplam Gelir" deger={`${toplamGelir.toLocaleString('tr-TR')} ₺`} alt="Tüm zamanlar" />
        </div>

        {/* Kritik Stok Uyarısı */}
        {aktifSekme === 'stok' && kritikStokUrunler.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🚨</span>
              <h3 className="text-sm font-bold text-red-700">Kritik Stok Uyarısı — {kritikStokUrunler.length} ürün</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(kritikHepsi ? kritikStokUrunler : kritikStokUrunler.slice(0, 12)).map((u) => (
                <div key={u.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-red-100">
                  <span className="text-xs text-stone-700 font-medium truncate mr-2">{u.ad}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    u.stok === 0 ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {u.stok === 0 ? 'Tükendi' : `${u.stok} adet`}
                  </span>
                </div>
              ))}
            </div>
            {kritikStokUrunler.length > 12 && (
              <button
                type="button"
                onClick={() => setKritikHepsi((v) => !v)}
                className="mt-3 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
              >
                {kritikHepsi ? 'Daha az göster ↑' : `+${kritikStokUrunler.length - 12} ürün daha göster ↓`}
              </button>
            )}
          </div>
        )}

        {/* Stok Yönetimi */}
        {aktifSekme === 'stok' && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-stone-900 mb-6">Stok Yönetimi</h2>
            <StokYonetimi adminUrunler={adminUrunler} />
          </div>
        )}

        {/* Raporlar */}
        {aktifSekme === 'raporlar' && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-stone-900 mb-6">Satış Raporları</h2>
            <RaporlarSekme siparisler={siparisler} adminUrunler={adminUrunler} />
          </div>
        )}

        {/* Ürünler */}
        {aktifSekme === 'urunler' && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-stone-900 mb-6">Ürün Yönetimi</h2>
            <UrunlerSekme />
          </div>
        )}

        {/* Siparişler */}
        {aktifSekme === 'siparisler' && (
        <div className="space-y-4">
          {gecikenSiparisler.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-bold text-red-700 text-sm">{gecikenSiparisler.length} sipariş 24+ saattir kargoya verilmedi!</p>
                <p className="text-xs text-red-500 mt-0.5">
                  {gecikenSiparisler.map(s => s.siparisNo).join(', ')}
                </p>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <h2 className="text-base font-bold text-stone-900">
              Siparişler
              <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-bold rounded-full">{siparisler.length}</span>
            </h2>
            <input
              type="text"
              placeholder="Sipariş no, isim, telefon ara..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
            />
          </div>

          {veriYukleniyor ? (
            <div className="py-16 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full" />
            </div>
          ) : filtreliSiparisler.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-medium">{arama ? 'Sonuç bulunamadı' : 'Henüz sipariş yok'}</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filtreliSiparisler.map((siparis) => (
                <div key={siparis.siparisNo}>
                  {/* Satır */}
                  <div
                    className={`grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-4 sm:px-6 py-4 hover:bg-rose-50/40 transition-colors cursor-pointer ${siparis.durum === 'İptal Talebi' ? 'bg-orange-50/60' : gecikenSiparisler.find(g => g.siparisNo === siparis.siparisNo) ? 'bg-red-50/60' : ''}`}
                    onClick={() => setAcikId(acikId === siparis.siparisNo ? null : siparis.siparisNo)}
                  >
                    {/* Tarih — sadece büyük ekranda */}
                    <div className="hidden sm:block">
                      <p className="text-xs text-stone-400">{new Date(siparis.tarih).toLocaleDateString('tr-TR')}</p>
                      <p className="text-xs text-stone-400">{new Date(siparis.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    {/* Müşteri + Sipariş No */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{siparis.musteri.adSoyad}</p>
                      <p className="text-xs text-rose-500 font-mono">{siparis.siparisNo}</p>
                      {gecikenSiparisler.find(g => g.siparisNo === siparis.siparisNo) && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">⏰ Gecikiyor</span>
                      )}
                      <p className="text-xs text-stone-400 sm:hidden">{new Date(siparis.tarih).toLocaleDateString('tr-TR')}</p>
                    </div>

                    {/* Telefon — sadece büyük ekranda */}
                    <p className="hidden sm:block text-sm text-stone-500">{siparis.musteri.telefon}</p>

                    {/* Tutar */}
                    <p className="text-sm font-bold text-stone-900 text-right sm:text-left">{siparis.genelToplam.toLocaleString('tr-TR')} ₺</p>

                    {/* Durum + Sil */}
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                      {siparis.durum === 'İptal Talebi' ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border ${DURUM_STIL['İptal Talebi']}`}>
                            İptal Talebi
                          </span>
                          <button
                            onClick={() => durumDegistir(siparis.siparisNo, 'İptal Edildi')}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => durumDegistir(siparis.siparisNo, 'Hazırlanıyor')}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors"
                          >
                            Reddet
                          </button>
                        </div>
                      ) : (
                        <select
                          value={siparis.durum}
                          onChange={(e) => durumDegistir(siparis.siparisNo, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border cursor-pointer focus:outline-none ${DURUM_STIL[siparis.durum] ?? 'bg-stone-100 text-stone-600 border-stone-200'}`}
                        >
                          {DURUMLAR.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => siparisSil(siparis.siparisNo)}
                        title="Siparişi sil"
                        className="text-stone-300 hover:text-red-500 transition-colors p-1"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Detay */}
                  {acikId === siparis.siparisNo && <SiparisDetay siparis={siparis} onKargoKaydet={kargoTakipKaydet} onFaturaDegisti={faturaDegisti} />}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
        )}

        {aktifSekme === 'iadeler' && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-bold text-stone-900">İade Talepleri <span className="text-stone-400 font-normal text-sm ml-1">{iadeler.length}</span></h2>
            </div>
            {iadeler.length === 0 ? (
              <div className="px-6 py-12 text-center text-stone-400 text-sm">📭 Henüz iade talebi yok</div>
            ) : (
              <div className="divide-y divide-stone-100">
                {iadeler.map((iade) => (
                  <div key={iade.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-stone-800">{iade.musteri_ad}</span>
                          <span className="font-mono text-xs text-rose-500">{iade.siparis_no}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            iade.durum === 'Beklemede' ? 'bg-orange-100 text-orange-700' :
                            iade.durum === 'Onaylandı' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-600'
                          }`}>{iade.durum}</span>
                          <span className="text-xs text-stone-400">{new Date(iade.tarih).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="text-xs text-stone-500 mb-1"><strong>Neden:</strong> {iade.neden}</p>
                        {iade.aciklama && <p className="text-xs text-stone-400 mb-1">{iade.aciklama}</p>}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {iade.urunler?.map((u, i) => (
                            <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{u.ad} ×{u.adet}</span>
                          ))}
                        </div>
                      </div>
                      {iade.durum === 'Beklemede' && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={async () => {
                              await fetch('/api/admin/iade', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: iade.id, durum: 'Onaylandı' }) })
                              setIadeler(prev => prev.map(i => i.id === iade.id ? { ...i, durum: 'Onaylandı' } : i))
                            }}
                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                          >Onayla</button>
                          <button
                            onClick={async () => {
                              await fetch('/api/admin/iade', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: iade.id, durum: 'Reddedildi' }) })
                              setIadeler(prev => prev.map(i => i.id === iade.id ? { ...i, durum: 'Reddedildi' } : i))
                            }}
                            className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >Reddet</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {aktifSekme === 'yorumlar' && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-bold text-stone-900">Yorumlar <span className="text-stone-400 font-normal text-sm ml-1">{yorumlar.length}</span></h2>
            </div>
            {yorumlar.length === 0 ? (
              <div className="px-6 py-12 text-center text-stone-400 text-sm">📭 Henüz yorum yok</div>
            ) : (
              <div className="divide-y divide-stone-100">
                {yorumlar.map((y) => (
                  <div key={y.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-stone-800">{y.kullanici_adi}</span>
                        <span className="text-amber-400 text-xs">{'★'.repeat(y.puan)}{'☆'.repeat(5 - y.puan)}</span>
                        <span className="text-xs text-stone-400">Ürün #{y.urun_id}</span>
                        <span className="text-xs text-stone-400">{new Date(y.tarih).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <p className="text-sm text-stone-600">{y.yorum}</p>
                    </div>
                    <button
                      onClick={async () => {
                        const ok = await askConfirm('Bu yorum kalıcı olarak silinecek. Bu işlem geri alınamaz.', {
                          title: 'Yorumu sil',
                          confirmLabel: 'Sil',
                          danger: true,
                        })
                        if (!ok) return
                        await fetch(`/api/reviews/${y.id}`, { method: 'DELETE' })
                        setYorumlar(prev => prev.filter(r => r.id !== y.id))
                      }}
                      title="Yorumu sil"
                      className="text-stone-300 hover:text-red-500 transition-colors p-1 shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {aktifSekme === 'musteriler' && (
          <MusterilerSekme musteriler={musteriler} />
        )}

        {aktifSekme === 'mesajlar' && (
          <MesajlarSekme mesajlar={mesajlar} setMesajlar={setMesajlar} />
        )}

        {aktifSekme === 'bildirimler' && (
          <BildirimlerSekme
            gecikenSiparisler={gecikenSiparisler}
            okunmamisMesajlar={okunmamisMesajlar}
            iadeler={iadeler}
            adminUrunler={adminUrunler}
            onSekmeGit={setAktifSekme}
          />
        )}
      </main>
    </div>
  )
}
