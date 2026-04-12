'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [kullanici, setKullanici] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    try {
      const kayitli = localStorage.getItem('gec_kullanici')
      if (kayitli) setKullanici(JSON.parse(kayitli))
    } catch {}
    setYukleniyor(false)
  }, [])

  async function girisYap(email, sifre) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sifre }),
      })
      const data = await res.json()
      if (!data.basarili) return { basarili: false, hata: data.hata, googleHesabi: !!data.googleHesabi }
      setKullanici(data.kullanici)
      localStorage.setItem('gec_kullanici', JSON.stringify(data.kullanici))
      return { basarili: true }
    } catch {
      return { basarili: false, hata: 'Bağlantı hatası oluştu.' }
    }
  }

  async function kayitOl(ad, email, sifre, onaylar = {}) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad, email, sifre, onaylar }),
      })
      const data = await res.json()
      if (!data.basarili) return { basarili: false, hata: data.hata }
      setKullanici(data.kullanici)
      localStorage.setItem('gec_kullanici', JSON.stringify(data.kullanici))
      return { basarili: true }
    } catch {
      return { basarili: false, hata: 'Bağlantı hatası oluştu.' }
    }
  }

  async function profilGuncelle(guncelBilgiler) {
    try {
      const res = await fetch('/api/auth/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: kullanici.id, ...guncelBilgiler }),
      })
      const data = await res.json()
      if (!data.basarili) return { basarili: false, hata: data.hata }
      setKullanici(data.kullanici)
      localStorage.setItem('gec_kullanici', JSON.stringify(data.kullanici))
      return { basarili: true }
    } catch {
      return { basarili: false, hata: 'Bağlantı hatası oluştu.' }
    }
  }

  async function onaylariGuncelle(yeniOnaylar) {
    return profilGuncelle({ onaylar: { ...kullanici?.onaylar, ...yeniOnaylar } })
  }

  async function sifreSifirla(email, yeniSifre) {
    // Şifre sıfırlama — e-posta doğrulaması olmadan (basit versiyon)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, yeniSifre }),
      })
      const data = await res.json()
      return data
    } catch {
      return { basarili: false, hata: 'Bağlantı hatası oluştu.' }
    }
  }

  function cikisYap() {
    setKullanici(null)
    localStorage.removeItem('gec_kullanici')
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ kullanici, yukleniyor, girisYap, kayitOl, profilGuncelle, onaylariGuncelle, sifreSifirla, cikisYap }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
