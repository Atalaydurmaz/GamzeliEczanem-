'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import kategoriler from '@/data/categories'

// Üst navbar için sadece ana kategori linkleri
const navLinks = kategoriler.map((k) => ({ href: k.href, label: k.label }))

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { toplamAdet } = useCart()
  const { kullanici } = useCurrentUser()
  const [aramaMetni, setAramaMetni] = useState('')
  const [aramaFocused, setAramaFocused] = useState(false)
  const [mobilAramaFocused, setMobilAramaFocused] = useState(false)
  const [aramaHata, setAramaHata] = useState(false)
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false)
  const [gorselMenuAcik, setGorselMenuAcik] = useState(false)
  const gorselInputRef = useRef(null)
  const kameraInputRef = useRef(null)
  const gorselMenuRef = useRef(null)
  const [kategorilerAcik, setKategorilerAcik] = useState(false)
  const [hoveredKat, setHoveredKat] = useState(kategoriler[0].id)
  const [mobileMenuAcik, setMobileMenuAcik] = useState(false)
  const [mobileAcikKat, setMobileAcikKat] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setKategorilerAcik(false)
      }
      if (gorselMenuRef.current && !gorselMenuRef.current.contains(e.target)) {
        setGorselMenuAcik(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setMobileMenuAcik(false)
    setKategorilerAcik(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileMenuAcik ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuAcik])

  function handleArama(e) {
    e.preventDefault()
    if (!aramaMetni.trim()) {
      setAramaHata(true)
      setTimeout(() => setAramaHata(false), 2500)
      return
    }
    router.push(`/arama?q=${encodeURIComponent(aramaMetni.trim())}`)
    setAramaMetni('')
    setAramaHata(false)
    setMobileMenuAcik(false)
  }

  async function handleGorselArama(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setGorselYukleniyor(true)
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch('/api/arama-gorsel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      sessionStorage.setItem('gorsel-arama-sonuc', JSON.stringify(data))
      router.push('/arama?gorsel=1')
      setMobileMenuAcik(false)
    } catch {
      alert('Görsel analiz edilirken hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setGorselYukleniyor(false)
    }
  }

  const hoveredData = kategoriler.find((k) => k.id === hoveredKat)

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">

      {/* ── 1. ÜST İNCE BAR ─────────────────────────────── */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1 font-semibold text-rose-700">
            <span>🇹🇷</span> TR
          </span>
          <div className="hidden sm:flex items-center gap-1">
            <a href="tel:02624126928"
              className="flex items-center gap-1.5 px-3 py-1 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Müşteri Destek: <span className="font-semibold text-gray-700">0262 412 6928</span>
            </a>
            <span className="text-gray-200">|</span>
            <Link href="/siparis-takip"
              className="flex items-center gap-1.5 px-3 py-1 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Kargo Takibi
            </Link>
            <span className="text-gray-200">|</span>
            <Link href="/iletisim"
              className="flex items-center gap-1.5 px-3 py-1 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              İletişim
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. ORTA: Logo + Arama + İkonlar ─────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center gap-2 sm:gap-5 lg:gap-8">

          {/* Hamburger — sadece mobil, solda */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl hover:bg-rose-50 transition-colors shrink-0"
            onClick={() => setMobileMenuAcik(!mobileMenuAcik)}
            aria-label="Menü">
            {mobileMenuAcik ? (
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img src="/icon.png" alt="GAMZELİECZANEM" className="w-9 h-9 sm:w-12 sm:h-12 object-contain rounded-xl" />
            <div className="leading-tight">
              <span className="block text-[13px] sm:text-[16px] font-black tracking-[0.1em] sm:tracking-[0.15em] text-rose-700 uppercase">
                GAMZELİECZANEM
              </span>
              <span className="block text-[9px] tracking-[0.28em] text-rose-400 uppercase font-medium">
                Dermokozmetik
              </span>
            </div>
          </Link>

          {/* ── Arama Çubuğu ── */}
          <div
            className="flex-1 min-w-0 hidden md:flex max-w-xl lg:max-w-3xl rounded-2xl p-[2px] transition-all duration-300"
            style={{
              background: aramaFocused
                ? 'linear-gradient(135deg, #f43f5e, #ec4899, #818cf8)'
                : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
              boxShadow: aramaFocused
                ? '0 0 0 5px rgba(244,63,94,0.1), 0 10px 40px rgba(244,63,94,0.2)'
                : '0 2px 8px rgba(0,0,0,0.07)',
            }}
          >
            {/* Gizli file inputlar — form dışında olması sorun değil */}
            <input ref={gorselInputRef} type="file" accept="image/*" className="hidden" aria-label="Görsel yükle" tabIndex={-1} onChange={handleGorselArama} />
            <input ref={kameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Kamera ile çek" tabIndex={-1} onChange={handleGorselArama} />

            <div className="relative flex items-center w-full h-14 bg-white rounded-2xl">
              {/* Form: sadece text input kısmı — overflow-hidden buraya sınırlı */}
              {aramaHata && (
                <div className="absolute top-full left-0 mt-1.5 ml-4 px-3 py-1.5 bg-rose-500 text-white text-xs font-medium rounded-lg shadow-lg z-50 pointer-events-none whitespace-nowrap">
                  Lütfen bir ürün adı girin
                </div>
              )}
              <form
                id="main-search-form"
                onSubmit={handleArama}
                onFocus={() => setAramaFocused(true)}
                onBlur={() => setAramaFocused(false)}
                className="flex items-center flex-1 min-w-0 h-full overflow-hidden rounded-l-2xl"
              >
                {/* YZ badge pill — sadece lg'de göster */}
                <div className="hidden lg:flex items-center gap-2 pl-5 pr-4 shrink-0">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                    style={{ background: 'linear-gradient(135deg,rgba(244,63,94,0.08),rgba(167,139,250,0.08))' }}
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11l-1.5-3.5L3 6l3.5-1.5L8 1z" fill="url(#sg2)" />
                      <defs><linearGradient id="sg2" x1="3" y1="1" x2="13" y2="11" gradientUnits="userSpaceOnUse"><stop stopColor="#f43f5e"/><stop offset="1" stopColor="#a78bfa"/></linearGradient></defs>
                    </svg>
                    <span
                      className="text-[12px] font-black tracking-wide"
                      style={{ background: 'linear-gradient(135deg,#f43f5e,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                      Yapay Zeka
                    </span>
                  </div>
                  <div className="w-px h-6 bg-gray-200 shrink-0" />
                </div>

                {/* Search icon */}
                <svg
                  className="w-5 h-5 shrink-0 ml-4 lg:ml-0 mr-3 transition-colors duration-200"
                  style={{ color: aramaFocused ? '#f43f5e' : '#9ca3af' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                <input
                  type="text"
                  placeholder="Eczacı asistanımıza sorun: Hangi ürünü aramıştınız?"
                  value={aramaMetni}
                  onChange={(e) => setAramaMetni(e.target.value)}
                  className="flex-1 min-w-0 h-full text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                />
              </form>

              {/* Kamera butonu — formun DIŞINDA, overflow-hidden yok */}
              <div className="relative shrink-0 h-full" ref={gorselMenuRef}>
                <button
                  type="button"
                  onClick={() => setGorselMenuAcik((o) => !o)}
                  disabled={gorselYukleniyor}
                  title="Görselle ara"
                  className="h-full px-4 flex items-center justify-center border-x border-gray-100 text-gray-400 hover:text-rose-500 hover:scale-110 active:scale-90 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {gorselYukleniyor ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>

                {gorselMenuAcik && (
                  <div className="absolute top-full right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <button
                      type="button"
                      onClick={() => { setGorselMenuAcik(false); kameraInputRef.current?.click() }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Fotoğraf Çek
                    </button>
                    <div className="h-px bg-gray-100" />
                    <button
                      type="button"
                      onClick={() => { setGorselMenuAcik(false); gorselInputRef.current?.click() }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Galeriden Seç
                    </button>
                  </div>
                )}
              </div>

              {/* Submit — form dışında, form="main-search-form" ile bağlı */}
              <button
                type="submit"
                form="main-search-form"
                className="h-full px-7 shrink-0 flex items-center gap-2.5 text-white font-bold text-[15px] rounded-r-2xl transition-all duration-200 hover:brightness-110 hover:shadow-lg active:scale-95 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 60%, #a855f7 100%)' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden lg:inline">Ara</span>
              </button>
            </div>
          </div>

          {/* Sağ: İkon Grubu */}
          <div className="flex items-center gap-0 sm:gap-1 ml-auto md:ml-0 shrink-0">
            <Link href="/hesabim/favoriler" className="flex flex-col items-center gap-0.5 px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors group">
              <svg className="w-[22px] h-[22px] text-gray-500 group-hover:text-rose-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="hidden lg:block text-[10px] text-gray-400 group-hover:text-rose-600 transition-colors leading-none">Favorilerim</span>
            </Link>

            <Link href="/hesabim" className="flex flex-col items-center gap-0.5 px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors group">
              {kullanici ? (
                <div className="w-[22px] h-[22px] rounded-full bg-rose-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {kullanici.ad.charAt(0).toUpperCase()}
                </div>
              ) : (
                <svg className="w-[22px] h-[22px] text-gray-500 group-hover:text-rose-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              <span className="hidden lg:block text-[10px] text-gray-400 group-hover:text-rose-600 transition-colors leading-none">
                {kullanici ? kullanici.ad.split(' ')[0] : 'Hesabım'}
              </span>
            </Link>

            <Link href="/sepet"
              className="flex flex-col items-center gap-0.5 px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors group relative">
              <div className="relative">
                <svg className="w-[22px] h-[22px] text-gray-500 group-hover:text-rose-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {toplamAdet > 0 && (
                  <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-rose-600 rounded-full px-1 leading-none">
                    {toplamAdet > 9 ? '9+' : toplamAdet}
                  </span>
                )}
              </div>
              <span className="hidden lg:block text-[10px] text-gray-400 group-hover:text-rose-600 transition-colors leading-none">Sepetim</span>
            </Link>

          </div>
        </div>
      </div>

      {/* ── MOBİL ARAMA ÇUBUĞU ─────────────────────────── */}
      <div className="md:hidden bg-white border-b border-gray-100 px-3 py-2">
        <input ref={gorselInputRef} type="file" accept="image/*" className="hidden" aria-label="Görsel yükle" tabIndex={-1} onChange={handleGorselArama} />
        <form onSubmit={handleArama} className={`flex items-center gap-2 bg-gray-50 border rounded-xl px-3 h-11 focus-within:bg-white transition-all ${aramaHata ? 'border-rose-400' : 'border-gray-200 focus-within:border-rose-400'}`}>
          {/* Yapay Zeka badge */}
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(244,63,94,0.1),rgba(167,139,250,0.1))', color: '#f43f5e' }}>
            ✦ Yapay Zeka
          </span>
          <div className="w-px h-4 bg-gray-200 shrink-0" />
          <input
            type="text"
            placeholder="Ürün, kategori veya marka ara..."
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            onFocus={() => setMobilAramaFocused(true)}
            onBlur={() => setMobilAramaFocused(false)}
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
          />
          <button type="button" aria-label="Görselle ara" onClick={() => gorselInputRef.current?.click()} className="shrink-0 text-gray-400 hover:text-rose-500 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button type="submit" className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-4 h-8 rounded-lg transition-colors">
            Ara
          </button>
        </form>
        {aramaHata && (
          <p className="text-xs text-rose-500 font-medium mt-1 pl-2">Lütfen bir ürün adı girin</p>
        )}
      </div>

      {/* ── 3. ALT NAVBAR ────────────────────────────────── */}
      <div className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-11">

            {/* Tüm Kategoriler — Mega Menü */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setKategorilerAcik(!kategorilerAcik)}
                onMouseEnter={() => { setKategorilerAcik(true); setHoveredKat(kategoriler[0].id) }}
                className="flex items-center gap-2 h-11 px-5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors select-none">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Tüm Kategoriler
                <svg className={`w-3.5 h-3.5 ml-0.5 transition-transform duration-200 ${kategorilerAcik ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Mega Menü Dropdown */}
              {kategorilerAcik && (
                <div
                  className="absolute top-full left-0 z-50 flex shadow-2xl border border-gray-200 rounded-b-2xl overflow-hidden bg-white"
                  style={{ width: '640px' }}
                  onMouseLeave={() => setKategorilerAcik(false)}
                >
                  {/* Sol: Ana kategoriler listesi */}
                  <div className="w-52 bg-gray-50 border-r border-gray-200 py-2 shrink-0">
                    {kategoriler.map((kat) => (
                      <button
                        key={kat.id}
                        onMouseEnter={() => setHoveredKat(kat.id)}
                        onClick={() => setKategorilerAcik(false)}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors text-left ${
                          hoveredKat === kat.id
                            ? 'bg-white text-rose-700 border-r-2 border-rose-600'
                            : 'text-gray-700 hover:bg-white hover:text-rose-600'
                        }`}
                      >
                        <span className="text-base w-6 text-center shrink-0">{kat.ikon}</span>
                        <Link href={kat.href} className="flex-1" onClick={() => setKategorilerAcik(false)}>
                          {kat.label}
                        </Link>
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>

                  {/* Sağ: Seçili kategorinin alt kategorileri */}
                  {hoveredData && (
                    <div className="flex-1 p-5 grid grid-cols-2 gap-x-6 gap-y-1 content-start">
                      <div className="col-span-2 mb-2 pb-2 border-b border-gray-100 flex items-center gap-2">
                        <span className="text-lg">{hoveredData.ikon}</span>
                        <Link
                          href={hoveredData.href}
                          onClick={() => setKategorilerAcik(false)}
                          className="text-sm font-bold text-rose-700 hover:underline"
                        >
                          Tüm {hoveredData.label} →
                        </Link>
                      </div>
                      {hoveredData.altKategoriler.map((alt) => (
                        <div key={alt.id} className="mb-3">
                          <Link
                            href={alt.href}
                            onClick={() => setKategorilerAcik(false)}
                            className="text-xs font-bold text-gray-800 hover:text-rose-700 transition-colors uppercase tracking-wide block mb-1.5"
                          >
                            {alt.label}
                          </Link>
                          <ul className="space-y-1">
                            {alt.urunler.map((urun) => (
                              <li key={urun.href}>
                                <Link
                                  href={urun.href}
                                  onClick={() => setKategorilerAcik(false)}
                                  className="text-xs text-gray-500 hover:text-rose-600 transition-colors block leading-tight"
                                >
                                  {urun.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ayraç */}
            <div className="w-px h-6 bg-gray-200 mx-3 shrink-0" />

            {/* Kategori linkleri */}
            <nav className="flex items-center flex-1 overflow-x-auto">
              {navLinks.map((link) => {
                const aktif = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center h-11 px-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                      aktif
                        ? 'text-rose-700 border-rose-600'
                        : 'text-gray-700 border-transparent hover:text-rose-600 hover:border-rose-300'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 shrink-0 ml-3">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              1.500₺ üzeri ücretsiz kargo
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBİL MENÜ ───────────────────────────────────── */}
      {mobileMenuAcik && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl max-h-[80vh] overflow-y-auto">
          {/* Mobil arama */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div
              className="rounded-full p-[2px] transition-all duration-300"
              style={{
                background: mobilAramaFocused
                  ? 'linear-gradient(135deg, #f43f5e, #ec4899, #818cf8)'
                  : 'linear-gradient(135deg, #e5e7eb, #e5e7eb)',
                boxShadow: mobilAramaFocused
                  ? '0 0 0 3px rgba(244,63,94,0.12), 0 4px 16px rgba(244,63,94,0.15)'
                  : '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <form
                onSubmit={handleArama}
                onFocus={() => setMobilAramaFocused(true)}
                onBlur={() => setMobilAramaFocused(false)}
                className="flex h-10 bg-white rounded-full overflow-hidden items-center"
              >
                <div className="flex items-center pl-3.5 pr-2 shrink-0 gap-1">
                  <span
                    className="text-[10px] font-black"
                    style={{ background: 'linear-gradient(135deg,#f43f5e,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    YZ
                  </span>
                  <div className="w-px h-3.5 bg-gray-200" />
                </div>
                <input
                  type="text"
                  placeholder="Sana özel ürünü Yapay Zeka ile bul..."
                  value={aramaMetni}
                  onChange={(e) => setAramaMetni(e.target.value)}
                  className="flex-1 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                />
                <button
                  type="submit"
                  className="h-full px-4 text-white shrink-0 rounded-full transition-opacity hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* Mobil kategori ağacı (accordion) */}
          <nav className="divide-y divide-gray-100">
            {kategoriler.map((kat) => {
              const acik = mobileAcikKat === kat.id
              const aktif = pathname === kat.href || pathname.startsWith(kat.href)
              return (
                <div key={kat.id}>
                  <div className={`flex items-center justify-between px-5 py-3.5 ${aktif ? 'bg-rose-50' : ''}`}>
                    <Link
                      href={kat.href}
                      onClick={() => setMobileMenuAcik(false)}
                      className={`flex items-center gap-2.5 flex-1 text-sm font-medium ${aktif ? 'text-rose-700' : 'text-gray-700'}`}
                    >
                      <span>{kat.ikon}</span>
                      {kat.label}
                    </Link>
                    <button
                      onClick={() => setMobileAcikKat(acik ? null : kat.id)}
                      className="p-1 ml-2 text-gray-400 hover:text-rose-600 transition-colors"
                    >
                      <svg className={`w-4 h-4 transition-transform ${acik ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Alt kategoriler */}
                  {acik && (
                    <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 space-y-4">
                      {kat.altKategoriler.map((alt) => (
                        <div key={alt.id}>
                          <Link
                            href={alt.href}
                            onClick={() => setMobileMenuAcik(false)}
                            className="text-xs font-bold text-gray-700 uppercase tracking-wide hover:text-rose-700 transition-colors block mb-1.5"
                          >
                            {alt.label}
                          </Link>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {alt.urunler.map((urun) => (
                              <Link
                                key={urun.href}
                                href={urun.href}
                                onClick={() => setMobileMenuAcik(false)}
                                className="text-xs text-gray-500 hover:text-rose-600 transition-colors"
                              >
                                {urun.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Sepet linki */}
            <Link
              href="/sepet"
              onClick={() => setMobileMenuAcik(false)}
              className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-rose-600 transition-colors"
            >
              <span className="flex items-center gap-2">
                Sepetim
                {toplamAdet > 0 && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">{toplamAdet}</span>
                )}
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </nav>

          <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 bg-gray-50">
            <a href="tel:02624126928"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              0262 412 6928
            </a>
            <span className="text-gray-300">|</span>
            <Link href="/hesabim/favoriler" onClick={() => setMobileMenuAcik(false)} className="text-xs text-gray-500 hover:text-rose-600 transition-colors">Favorilerim</Link>
            <span className="text-gray-300">|</span>
            <Link href="/hesabim" onClick={() => setMobileMenuAcik(false)} className="text-xs text-gray-500 hover:text-rose-600 transition-colors">
              {kullanici ? kullanici.ad.split(' ')[0] : 'Hesabım'}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
