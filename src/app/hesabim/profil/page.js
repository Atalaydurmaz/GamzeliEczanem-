'use client'

import { useSession } from 'next-auth/react'

export default function ProfilimDetayPage() {
  const { data: session } = useSession()

  return (
    <div className="bg-white rounded-3xl border border-stone-100 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8 border-b border-stone-50 pb-6">
        <div>
          <h2 className="text-2xl font-black text-stone-900 italic uppercase">Profil Bilgilerim</h2>
          <p className="text-sm text-stone-400 mt-1 font-medium">Kişisel bilgilerinizi buradan yönetebilirsiniz.</p>
        </div>
        <div className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
          Aktif Üye
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sol Kolon - İsim Soyisim */}
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[2px] mb-2">Ad Soyad</label>
            <div className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 font-semibold text-stone-800">
              {session?.user?.name || "Atalay Durmaz"}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[2px] mb-2">E-Posta Adresi</label>
            <div className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 font-semibold text-stone-800">
              {session?.user?.email || "durmazatalay6@gmail.com"}
            </div>
          </div>
        </div>

        {/* Sağ Kolon - Eğitim ve Konum (Kişisel Dokunuş) */}
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[2px] mb-2">Eğitim / Mühendislik</label>
            <div className="w-full bg-emerald-50/50 border border-emerald-100 rounded-2xl px-5 py-4 font-semibold text-emerald-800 flex items-center gap-3">
              <span className="text-xl">🎓</span>
              Sakarya Üniversitesi - Bilişim Sistemleri
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[2px] mb-2">Konum / Şehir</label>
            <div className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-5 py-4 font-semibold text-rose-800 flex items-center gap-3">
              <span className="text-xl">📍</span>
              Gölcük, Kocaeli
            </div>
          </div>
        </div>
      </div>

      {/* Alt Bilgi */}
      <div className="mt-12 pt-8 border-t border-stone-50">
        <button className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all active:scale-95 shadow-xl shadow-stone-100">
          Bilgilerimi Güncelle
        </button>
      </div>
    </div>
  )
}
