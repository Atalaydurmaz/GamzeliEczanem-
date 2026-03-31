'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

// Model weights from jsDelivr GitHub CDN (face-api.js repo)
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights'

// ── Color palettes ──────────────────────────────────────────────────────────
const allikRenkleri = [
  { id: 'pembe',   ad: 'Pembe',   renk: '#F06292' },
  { id: 'seftali', ad: 'Şeftali', renk: '#FF8A65' },
  { id: 'mercan',  ad: 'Mercan',  renk: '#E64A19' },
  { id: 'gul',     ad: 'Gül',     renk: '#C2185B' },
  { id: 'bronz',   ad: 'Bronz',   renk: '#A0522D' },
  { id: 'mor',     ad: 'Mor',     renk: '#8E24AA' },
  { id: 'kirmizi', ad: 'Kırmızı', renk: '#C62828' },
  { id: 'nud',     ad: 'Nud',     renk: '#BC8F6A' },
]

const gozFariRenkleri = [
  { id: 'kahve',  ad: 'Kahve',   renk: '#4E342E' },
  { id: 'siyah',  ad: 'Siyah',   renk: '#212121' },
  { id: 'altin',  ad: 'Altın',  renk: '#F9A825' },
  { id: 'mor',    ad: 'Mor',     renk: '#6A1B9A' },
  { id: 'mavi',   ad: 'Mavi',    renk: '#0D47A1' },
  { id: 'yesil',  ad: 'Yeşil',  renk: '#2E7D32' },
  { id: 'pembe',  ad: 'Pembe',   renk: '#E91E63' },
  { id: 'gumus',  ad: 'Gümüş',  renk: '#607D8B' },
]

// ── Canvas drawing helpers ──────────────────────────────────────────────────
function hexToRgba(hex, a) {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/**
 * Blush: soft radial-gradient ellipse on each cheekbone area.
 * Centers derived from face width (pts[0]→pts[16]) at nose-tip Y level.
 */
function drawBlush(ctx, pts, renk) {
  const faceW = pts[16].x - pts[0].x
  const radius = faceW * 0.145

  // Cheek centers: ≈24 % and 76 % of face width, slightly below nose tip
  const centers = [
    { x: pts[0].x + faceW * 0.24, y: pts[29].y + faceW * 0.07 },
    { x: pts[0].x + faceW * 0.76, y: pts[29].y + faceW * 0.07 },
  ]

  for (const { x: cx, y: cy } of centers) {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    grad.addColorStop(0,    hexToRgba(renk, 0.54))
    grad.addColorStop(0.45, hexToRgba(renk, 0.28))
    grad.addColorStop(1,    hexToRgba(renk, 0))

    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.beginPath()
    // Slightly wider than tall, slight tilt toward ear
    ctx.ellipse(cx, cy, radius, radius * 0.62, -0.15, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()
  }
}

/**
 * Eyeshadow: gradient-filled polygon over each upper eyelid.
 *
 * 68-point layout used:
 *   Left  eye: outer=36, upper lid=37,38, inner=39 | left brow center=pts[19]
 *   Right eye: inner=42, upper lid=43,44, outer=45 | right brow center=pts[24]
 *
 * Shape: outer→upper lid points→inner, then bezier arc UP back to outer.
 * Gradient fades from the lash line up to the crease.
 */
function drawEyeshadow(ctx, pts, renk) {
  const eyes = [
    {
      lC: pts[36], up1: pts[37], up2: pts[38], rC: pts[39],
      browY: pts[19].y,
    },
    {
      lC: pts[42], up1: pts[43], up2: pts[44], rC: pts[45],
      browY: pts[24].y,
    },
  ]

  for (const { lC, up1, up2, rC, browY } of eyes) {
    // Shadow top Y: 42 % of the way from lid to brow (min 8 px)
    const lidTopY = Math.min(lC.y, rC.y, up1.y, up2.y)
    const depth    = lidTopY - browY               // pixels from lid to brow
    const topY     = lidTopY - Math.max(depth * 0.42, 8)

    const midX     = (lC.x + rC.x) / 2
    const lidMidY  = (up1.y + up2.y) / 2

    ctx.save()
    ctx.beginPath()

    // Bottom edge: follow the upper eyelid curve (lC → up1 → up2 → rC)
    ctx.moveTo(lC.x, lC.y)
    ctx.lineTo(up1.x, up1.y)
    ctx.lineTo(up2.x, up2.y)
    ctx.lineTo(rC.x, rC.y)

    // Arc back UP above the lid to lC (shadow "ceiling")
    ctx.bezierCurveTo(
      rC.x, topY,   // cp1 above right corner
      lC.x, topY,   // cp2 above left corner
      lC.x, lC.y    // close at left corner
    )
    ctx.closePath()

    // Gradient: opaque at lash line, transparent at crease
    const grad = ctx.createLinearGradient(midX, lidMidY, midX, topY)
    grad.addColorStop(0,    hexToRgba(renk, 0.68))
    grad.addColorStop(0.55, hexToRgba(renk, 0.38))
    grad.addColorStop(1,    hexToRgba(renk, 0))

    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()
  }
}

function drawMakeup(canvas, imgSrc, landmarks, allik, gozFari) {
  if (!canvas || !imgSrc) return
  const ctx = canvas.getContext('2d')
  const img = new Image()
  img.onload = () => {
    canvas.width  = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
    if (!landmarks) return
    const pts = landmarks.positions
    if (allik)   drawBlush(ctx, pts, allik.renk)
    if (gozFari) drawEyeshadow(ctx, pts, gozFari.renk)
  }
  img.src = imgSrc
}

// ── Component ───────────────────────────────────────────────────────────────
export default function SanalDeneme() {
  const [modeller,     setModeller]     = useState('bekliyor') // bekliyor|yukleniyor|hazir|hata
  const [gorsel,       setGorsel]       = useState(null)
  const [landmarks,    setLandmarks]    = useState(null)
  const [islem,        setIslem]        = useState(false)
  const [yuzYok,       setYuzYok]       = useState(false)
  const [sekme,        setSekme]        = useState('allik')   // 'allik' | 'gozfari'
  const [seciliAllik,  setSeciliAllik]  = useState(null)
  const [seciliGozFar, setSeciliGozFar] = useState(null)

  const canvasRef  = useRef(null)
  const faceapiRef = useRef(null)

  // ── Load face-api.js + tiny model weights (client-only) ──────────────────
  useEffect(() => {
    setModeller('yukleniyor')
    import('face-api.js')
      .then(async (fa) => {
        faceapiRef.current = fa
        await Promise.all([
          fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          fa.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ])
        setModeller('hazir')
      })
      .catch(() => setModeller('hata'))
  }, [])

  // ── Face detection ────────────────────────────────────────────────────────
  const tanimla = useCallback(async (imgSrc) => {
    if (!faceapiRef.current) return
    setIslem(true)
    setYuzYok(false)
    try {
      const img = new Image()
      img.src = imgSrc
      await new Promise((r) => { img.onload = r })
      const det = await faceapiRef.current
        .detectSingleFace(img, new faceapiRef.current.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
        .withFaceLandmarks(true)
      if (det) {
        setLandmarks(det.landmarks)
      } else {
        setYuzYok(true)
        setLandmarks(null)
      }
    } catch {
      setYuzYok(true)
    }
    setIslem(false)
  }, [])

  // ── Load image from File, reset selections ─────────────────────────────────
  const gorselSec = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target.result
      setGorsel(src)
      setLandmarks(null)
      setSeciliAllik(null)
      setSeciliGozFar(null)
      tanimla(src)
    }
    reader.readAsDataURL(file)
  }, [tanimla])

  // ── Re-render canvas whenever image / landmarks / colors change ───────────
  useEffect(() => {
    if (!gorsel || !canvasRef.current) return
    drawMakeup(canvasRef.current, gorsel, landmarks, seciliAllik, seciliGozFar)
  }, [gorsel, landmarks, seciliAllik, seciliGozFar])

  const indir = () => {
    if (!canvasRef.current) return
    const a = document.createElement('a')
    a.href = canvasRef.current.toDataURL('image/jpeg', 0.92)
    a.download = 'makyaj-deneme.jpg'
    a.click()
  }

  // ── Helpers for the palette UI ────────────────────────────────────────────
  const activeCountBadge = [seciliAllik, seciliGozFar].filter(Boolean).length

  return (
    <div className="bg-white min-h-screen">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-b border-rose-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-stone-400 mb-3 flex items-center gap-1.5">
            <Link href="/" className="hover:text-rose-500 transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <Link href="/makyaj" className="hover:text-rose-500 transition-colors">Makyaj</Link>
            <span>/</span>
            <span className="text-stone-600">Sanal Deneme</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-3xl">✨</span>
            <div>
              <h1 className="text-3xl font-bold text-stone-900">Sanal Makyaj Deneme</h1>
              <p className="text-stone-500 mt-1">
                Selfie yükle veya çek, allık ve göz farı renklerini yüzünde dene
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Model loading ────────────────────────────────────────────── */}
        {modeller === 'yukleniyor' && (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-stone-500 text-sm">Yüz tanıma modeli yükleniyor…</p>
            <p className="text-stone-400 text-xs mt-1">İlk açılışta birkaç saniye sürebilir</p>
          </div>
        )}

        {/* ── Model error ──────────────────────────────────────────────── */}
        {modeller === 'hata' && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="font-medium text-rose-600">Yüz tanıma modeli yüklenemedi</p>
            <p className="text-stone-400 text-sm mt-1">İnternet bağlantınızı kontrol edip sayfayı yenileyin.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 px-6 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              Yenile
            </button>
          </div>
        )}

        {/* ── Main UI ──────────────────────────────────────────────────── */}
        {modeller === 'hazir' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

            {/* ── Left: upload zone / camera / canvas ───────────────── */}
            <div className="lg:col-span-3 space-y-4">

              {/* Drop zone */}
              {!gorsel && (
                <div className="border-2 border-dashed border-rose-200 rounded-2xl p-12 text-center bg-rose-50/50">
                  <p className="text-5xl mb-4">📸</p>
                  <p className="text-stone-600 font-medium mb-2">
                    Yüzünüzün net göründüğü bir selfie ekleyin
                  </p>
                  <p className="text-stone-400 text-sm mb-7">
                    Cepheden, aydınlık ortamda çekilmiş fotoğraflar en iyi sonucu verir
                  </p>
                  <label className="inline-block px-6 py-3 bg-rose-500 text-white rounded-full text-sm font-semibold cursor-pointer hover:bg-rose-600 transition-colors">
                    Fotoğraf Yükle
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files[0] && gorselSec(e.target.files[0])}
                    />
                  </label>
                </div>
              )}

              {/* Canvas */}
              {gorsel && (
                <div className="relative rounded-2xl overflow-hidden bg-stone-100 shadow-lg">
                  {islem && (
                    <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-10 gap-3">
                      <div className="w-9 h-9 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                      <p className="text-sm text-stone-500">Yüz tanınıyor…</p>
                    </div>
                  )}

                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto block"
                    style={{ maxHeight: 560 }}
                  />

                  {yuzYok && !islem && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-2 rounded-full shadow">
                      Yüz tespit edilemedi — daha net bir selfie deneyin
                    </div>
                  )}

                  {/* Active products badge */}
                  {activeCountBadge > 0 && !islem && (
                    <div className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                      {activeCountBadge} ürün
                    </div>
                  )}
                </div>
              )}

              {/* Action row */}
              {gorsel && (
                <div className="flex gap-3">
                  <button
                    onClick={indir}
                    disabled={!landmarks}
                    className="flex-1 py-2.5 bg-stone-900 text-white rounded-full text-sm font-semibold hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ⬇ İndir
                  </button>
                  <label className="flex-1 py-2.5 bg-white text-stone-700 border border-stone-200 rounded-full text-sm font-semibold text-center cursor-pointer hover:bg-stone-50 transition-colors">
                    Fotoğraf Değiştir
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files[0] && gorselSec(e.target.files[0])}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* ── Right: tabs + palettes + tips ─────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Tab switcher */}
              <div className="flex rounded-full bg-stone-100 p-1">
                <button
                  onClick={() => setSekme('allik')}
                  className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                    sekme === 'allik'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  🌸 Allık
                </button>
                <button
                  onClick={() => setSekme('gozfari')}
                  className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                    sekme === 'gozfari'
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  👁 Göz Farı
                </button>
              </div>

              {/* ── Blush palette ──────────────────────────────────────── */}
              {sekme === 'allik' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-stone-700">Allık Rengi Seç</p>
                  <div className="grid grid-cols-4 gap-3">
                    {allikRenkleri.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setSeciliAllik((prev) => (prev?.id === r.id ? null : r))}
                        title={r.ad}
                        className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                          seciliAllik?.id === r.id
                            ? 'bg-rose-50 ring-2 ring-rose-400'
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full shadow-sm ring-1 ring-black/10"
                          style={{ backgroundColor: r.renk }}
                        />
                        <span className="text-[10px] text-stone-500 leading-none">{r.ad}</span>
                      </button>
                    ))}
                  </div>

                  {seciliAllik ? (
                    <div className="p-3 bg-rose-50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full ring-1 ring-rose-200"
                          style={{ backgroundColor: seciliAllik.renk }}
                        />
                        <span className="text-sm font-medium text-stone-700">{seciliAllik.ad}</span>
                      </div>
                      <button
                        onClick={() => setSeciliAllik(null)}
                        className="text-xs text-stone-400 hover:text-rose-500 transition-colors"
                      >
                        ✕ Kaldır
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 text-center">
                      Bir renk seçin — yanakta yumuşak allık efekti
                    </p>
                  )}
                </div>
              )}

              {/* ── Eyeshadow palette ──────────────────────────────────── */}
              {sekme === 'gozfari' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-stone-700">Göz Farı Rengi Seç</p>
                  <div className="grid grid-cols-4 gap-3">
                    {gozFariRenkleri.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setSeciliGozFar((prev) => (prev?.id === r.id ? null : r))}
                        title={r.ad}
                        className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                          seciliGozFar?.id === r.id
                            ? 'bg-violet-50 ring-2 ring-violet-400'
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full shadow-sm ring-1 ring-black/10"
                          style={{ backgroundColor: r.renk }}
                        />
                        <span className="text-[10px] text-stone-500 leading-none">{r.ad}</span>
                      </button>
                    ))}
                  </div>

                  {seciliGozFar ? (
                    <div className="p-3 bg-violet-50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full ring-1 ring-violet-200"
                          style={{ backgroundColor: seciliGozFar.renk }}
                        />
                        <span className="text-sm font-medium text-stone-700">{seciliGozFar.ad}</span>
                      </div>
                      <button
                        onClick={() => setSeciliGozFar(null)}
                        className="text-xs text-stone-400 hover:text-violet-500 transition-colors"
                      >
                        ✕ Kaldır
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 text-center">
                      Bir renk seçin — üst göz kapağına gradient efekt
                    </p>
                  )}
                </div>
              )}

              {/* Mix status: show active selections from BOTH categories */}
              {(seciliAllik || seciliGozFar) && (
                <div className="border border-stone-100 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Seçili Kombinasyon</p>
                  <div className="flex flex-wrap gap-2">
                    {seciliAllik && (
                      <span className="flex items-center gap-1.5 bg-rose-50 text-rose-700 text-xs px-3 py-1.5 rounded-full">
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: seciliAllik.renk }}
                        />
                        🌸 {seciliAllik.ad}
                      </span>
                    )}
                    {seciliGozFar && (
                      <span className="flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs px-3 py-1.5 rounded-full">
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: seciliGozFar.renk }}
                        />
                        👁 {seciliGozFar.ad}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setSeciliAllik(null); setSeciliGozFar(null) }}
                    className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    Tümünü temizle
                  </button>
                </div>
              )}

              {/* Tips */}
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">İpuçları</p>
                <ul className="text-xs text-stone-400 space-y-1.5">
                  <li>• Aydınlık ortamda cepheden çekilmiş selfie kullanın</li>
                  <li>• Saçınız yüzünüzü kapatmasın</li>
                  <li>• Gözlük olmadan daha iyi sonuç alınır</li>
                  <li>• Her iki ürünü birden seçip kombinasyonu görebilirsiniz</li>
                  <li>• Renk seçimini kaldırmak için tekrar tıklayın</li>
                </ul>
              </div>

              {/* CTA */}
              <Link
                href="/makyaj"
                className="block w-full py-3 bg-rose-500 text-white text-center rounded-full text-sm font-semibold hover:bg-rose-600 transition-colors"
              >
                Makyaj Ürünlerini Keşfet →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
