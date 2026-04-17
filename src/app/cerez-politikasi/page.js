export const metadata = {
  title: 'Çerez Politikası – GAMZELİECZANEM',
  description: 'GAMZELİECZANEM web sitesinde kullanılan çerezler ve tercihlerinizi yönetme hakkında bilgiler.',
}

export default function CerezPolitikasi() {
  return (
    <div className="min-h-screen">
      <div className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Çerez Politikası</h1>
          <p className="text-stone-500 text-sm">Son güncelleme: Nisan 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8 text-sm text-stone-700 leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">1. ÇEREZ NEDİR?</h2>
            <p>Çerezler (cookies), bir web sitesi tarafından tarayıcınıza gönderilen ve cihazınızda saklanan küçük metin dosyalarıdır. Siteyi tekrar ziyaret ettiğinizde bu dosyalar tarayıcı tarafından siteye geri gönderilir ve böylece giriş durumu, sepet içeriği, dil tercihi gibi bilgiler hatırlanabilir.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">2. HANGİ ÇEREZLERİ KULLANIYORUZ?</h2>

            <div className="space-y-5 mt-4">
              <div className="border border-stone-200 rounded-xl p-4">
                <h3 className="font-bold text-stone-900 mb-1">2.1. Zorunlu Çerezler</h3>
                <p className="text-stone-600 mb-2">Sitenin çalışması için gerekli olan çerezlerdir; devre dışı bırakılamazlar.</p>
                <ul className="list-disc pl-5 space-y-1 text-stone-700">
                  <li>Oturum çerezleri (giriş durumu).</li>
                  <li>Sepet ve ödeme süreci çerezleri.</li>
                  <li>Güvenlik ve CSRF koruması.</li>
                  <li>NextAuth oturum token'ı.</li>
                  <li>Admin oturum cookie'si (yalnızca admin panelinde).</li>
                </ul>
                <p className="mt-2 text-xs text-stone-500">Hukuki sebep: KVKK m.5/2-c (sözleşmenin ifası) + meşru menfaat.</p>
              </div>

              <div className="border border-stone-200 rounded-xl p-4">
                <h3 className="font-bold text-stone-900 mb-1">2.2. İşlevsel Çerezler</h3>
                <p className="text-stone-600 mb-2">Tercihlerinizi hatırlamaya yarar.</p>
                <ul className="list-disc pl-5 space-y-1 text-stone-700">
                  <li>Çerez banner tercih kaydı.</li>
                  <li>Son görüntülenen ürünler.</li>
                  <li>Favori ürünler (giriş yapmamış kullanıcılar için localStorage).</li>
                </ul>
              </div>

              <div className="border border-stone-200 rounded-xl p-4">
                <h3 className="font-bold text-stone-900 mb-1">2.3. Analitik / Performans Çerezleri</h3>
                <p className="text-stone-600 mb-2">Sitenin nasıl kullanıldığını anlamamıza yardımcı olur. Sadece açık rızanızla yüklenir.</p>
                <ul className="list-disc pl-5 space-y-1 text-stone-700">
                  <li>Ziyaretçi sayısı, sayfa görüntüleme.</li>
                  <li>Anonim kullanıcı davranışı analizleri.</li>
                </ul>
                <p className="mt-2 text-xs text-stone-500">Hukuki sebep: KVKK m.5/1 (açık rıza).</p>
              </div>

              <div className="border border-stone-200 rounded-xl p-4">
                <h3 className="font-bold text-stone-900 mb-1">2.4. Pazarlama Çerezleri</h3>
                <p className="text-stone-600 mb-2">Size uygun içerik/reklam göstermek için kullanılır. Sadece açık rızanızla yüklenir.</p>
                <ul className="list-disc pl-5 space-y-1 text-stone-700">
                  <li>Terk edilmiş sepet hatırlatmaları.</li>
                  <li>Kampanya hedefleme (varsa).</li>
                </ul>
                <p className="mt-2 text-xs text-stone-500">Hukuki sebep: KVKK m.5/1 (açık rıza).</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">3. ÜÇÜNCÜ TARAF ÇEREZLER</h2>
            <p>Sitemizde aşağıdaki üçüncü taraf hizmetlerin çerezleri bulunabilir:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>iyzico</strong> – Ödeme işlemleri (3D Secure akışında).</li>
              <li><strong>Google (NextAuth ile OAuth girişi):</strong> Giriş yapmayı seçtiyseniz.</li>
              <li><strong>Vercel:</strong> Site barındırma ve performans.</li>
            </ul>
            <p className="mt-3">Bu sağlayıcıların kendi gizlilik/çerez politikaları kendilerine aittir.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">4. ÇEREZ TERCİHLERİNİZİ NASIL YÖNETEBİLİRSİNİZ?</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Çerez banner:</strong> Siteyi ilk ziyaretinizde karşınıza çıkan banner üzerinden tercihlerinizi belirleyebilirsiniz. Daha sonra bu tercihleri tarayıcınızın geliştirici araçlarından veya siteye geri döndüğünüzde yeniden ayarlayabilirsiniz.</li>
              <li><strong>Tarayıcı ayarları:</strong> Tarayıcınızın ayarlarından tüm çerezleri silebilir veya engelleyebilirsiniz. Bu durumda bazı site özellikleri çalışmayabilir.</li>
              <li>
                Yardım linkleri:
                <ul className="list-[circle] pl-5 mt-1 space-y-0.5 text-xs text-stone-600">
                  <li>Chrome: chrome://settings/cookies</li>
                  <li>Firefox: about:preferences#privacy</li>
                  <li>Safari: Tercihler → Gizlilik</li>
                  <li>Edge: edge://settings/privacy</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">5. GÜNCELLEME</h2>
            <p>Bu çerez politikası mevzuat veya hizmet değişikliklerine bağlı olarak güncellenebilir. En güncel versiyon bu sayfada yayımlanır.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">6. İLETİŞİM</h2>
            <p>Çerezler ve kişisel verilerinize ilişkin sorularınız için <a href="mailto:destek.gamzelieczanem@gmail.com" className="text-rose-600 hover:underline">destek.gamzelieczanem@gmail.com</a> adresine e-posta gönderebilirsiniz. Daha fazla bilgi için <a href="/kvkk-aydinlatma-metni" className="text-rose-600 hover:underline">KVKK Aydınlatma Metnimizi</a> ve <a href="/gizlilik-politikasi" className="text-rose-600 hover:underline">Gizlilik Politikamızı</a> inceleyebilirsiniz.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
