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

  function girisYap(email, sifre) {
    try {
      const uyeler = JSON.parse(localStorage.getItem('gec_uyeler') || '[]')
      const uye = uyeler.find((u) => u.email === email && u.sifre === sifre)
      if (!uye) return { basarili: false, hata: 'E-posta veya şifre hatalı.' }
      const { sifre: _, ...guvenliUye } = uye
      setKullanici(guvenliUye)
      localStorage.setItem('gec_kullanici', JSON.stringify(guvenliUye))
      return { basarili: true }
    } catch {
      return { basarili: false, hata: 'Bir hata oluştu.' }
    }
  }

  function kayitOl(ad, email, sifre) {
    try {
      const uyeler = JSON.parse(localStorage.getItem('gec_uyeler') || '[]')
      if (uyeler.find((u) => u.email === email)) {
        return { basarili: false, hata: 'Bu e-posta adresi zaten kayıtlı.' }
      }
      const yeniUye = { id: Date.now(), ad, email, sifre, kayitTarihi: new Date().toISOString() }
      uyeler.push(yeniUye)
      localStorage.setItem('gec_uyeler', JSON.stringify(uyeler))
      const { sifre: _, ...guvenliUye } = yeniUye
      setKullanici(guvenliUye)
      localStorage.setItem('gec_kullanici', JSON.stringify(guvenliUye))
      return { basarili: true }
    } catch {
      return { basarili: false, hata: 'Bir hata oluştu.' }
    }
  }

  function profilGuncelle(guncelBilgiler) {
    try {
      const uyeler = JSON.parse(localStorage.getItem('gec_uyeler') || '[]')
      const idx = uyeler.findIndex((u) => u.id === kullanici.id)
      if (idx === -1) return { basarili: false, hata: 'Kullanıcı bulunamadı.' }
      uyeler[idx] = { ...uyeler[idx], ...guncelBilgiler }
      localStorage.setItem('gec_uyeler', JSON.stringify(uyeler))
      const { sifre: _, ...guvenliUye } = uyeler[idx]
      setKullanici(guvenliUye)
      localStorage.setItem('gec_kullanici', JSON.stringify(guvenliUye))
      return { basarili: true }
    } catch {
      return { basarili: false, hata: 'Bir hata oluştu.' }
    }
  }

  function sifreSifirla(email, yeniSifre) {
    try {
      const uyeler = JSON.parse(localStorage.getItem('gec_uyeler') || '[]')
      const idx = uyeler.findIndex((u) => u.email === email)
      if (idx === -1) return { basarili: false, hata: 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.' }
      uyeler[idx].sifre = yeniSifre
      localStorage.setItem('gec_uyeler', JSON.stringify(uyeler))
      return { basarili: true }
    } catch {
      return { basarili: false, hata: 'Bir hata oluştu.' }
    }
  }

  function cikisYap() {
    setKullanici(null)
    localStorage.removeItem('gec_kullanici')
  }

  return (
    <AuthContext.Provider value={{ kullanici, yukleniyor, girisYap, kayitOl, profilGuncelle, sifreSifirla, cikisYap }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
