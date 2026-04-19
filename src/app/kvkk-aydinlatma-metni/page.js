export const metadata = {
  title: 'KVKK Aydınlatma Metni – GAMZELİECZANEM',
  description: 'Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu tarafından hazırlanan aydınlatma metni.',
}

export default function KVKKAydinlatmaMetni() {
  return (
    <div className="min-h-screen">
      <div className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">KVKK Aydınlatma Metni</h1>
          <p className="text-stone-500 text-sm">6698 Sayılı Kişisel Verilerin Korunması Kanunu kapsamında</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8 text-sm text-stone-700 leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">1. VERİ SORUMLUSU</h2>
            <div className="space-y-1">
              <p>Ticaret Unvanı: ATALAY DURMAZ (Gerçek Kişilere Ait Ticari İşletme)</p>
              <p>Marka Adı: GAMZELİECZANEM</p>
              <p>MERSİS No: 1017857069400001</p>
              <p>Adres: Yüzbaşılar Mah. 3013. Sk. D Blok No:2D İç Kapı No:7, Gölcük / Kocaeli</p>
              <p>E-posta: destek@gamzelidermokozmetik.com</p>
              <p>Tel: 0262 412 6928</p>
            </div>
            <p className="mt-3">6698 Sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") m.10 uyarınca, veri sorumlusu sıfatıyla hazırlanan bu aydınlatma metni ile kişisel verilerinizin hangi amaçla işlendiği, kimlere aktarıldığı ve haklarınız konusunda sizi bilgilendirmek istiyoruz.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">2. İŞLENEN KİŞİSEL VERİLER</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Kimlik:</strong> Ad, soyad.</li>
              <li><strong>İletişim:</strong> Telefon, e-posta, teslimat/fatura adresi.</li>
              <li><strong>Müşteri İşlem:</strong> Sipariş bilgileri, sepet geçmişi, iade talepleri, yorum/değerlendirme.</li>
              <li><strong>Finansal:</strong> Ödeme işlem referansları (kart bilgileri iyzico'da saklanır, Satıcı saklamaz).</li>
              <li><strong>İşlem Güvenliği:</strong> IP adresi, tarayıcı bilgisi, oturum çerezleri.</li>
              <li><strong>Pazarlama:</strong> E-posta/SMS/push bülten tercihleri, açılmış bildirimler.</li>
              <li><strong>Sağlık (isteğe bağlı):</strong> Cilt analizi özelliğini kullanırsanız cildinizle ilgili metin/görsel bilgi. Bu veri hassas nitelikli olduğundan açık rızanızla işlenir ve cilt analizi sonrası silinir.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sipariş oluşturma, ödeme alma, ürün teslimatı ve satış sonrası destek.</li>
              <li>Üyelik kaydı, hesap yönetimi ve giriş güvenliği.</li>
              <li>Müşteri iletişimi (sipariş durumu, kargo takibi, iade süreci).</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi (fatura düzenleme, vergi, muhasebe).</li>
              <li>İade, cayma ve şikayet taleplerinin işlenmesi.</li>
              <li>Sadece açık rıza verilmişse: pazarlama iletişimi (bülten, kampanya SMS/e-posta).</li>
              <li>Sahtecilik/dolandırıcılık tespiti ve hesap güvenliği.</li>
              <li>Site performansı ve anonim istatistik.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">4. İŞLEMENİN HUKUKİ SEBEPLERİ (KVKK m.5)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>m.5/2-c (sözleşmenin kurulması/ifası):</strong> Sipariş, teslimat, ödeme, iade.</li>
              <li><strong>m.5/2-ç (hukuki yükümlülük):</strong> Fatura, vergi ve ticari defter kayıtları.</li>
              <li><strong>m.5/2-e (hakkın tesisi/kullanılması/korunması):</strong> Uyuşmazlık, ihtilaf yönetimi.</li>
              <li><strong>m.5/2-f (meşru menfaat):</strong> Güvenlik, dolandırıcılık tespiti, anonim analiz.</li>
              <li><strong>m.5/1 (açık rıza):</strong> Pazarlama iletişimi, çerezler (zorunlu olmayanlar), cilt analizi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">5. KİŞİSEL VERİLERİN AKTARILDIĞI TARAFLAR</h2>
            <p>Kişisel verileriniz, yasal yükümlülükler ve hizmet sunumu kapsamında aşağıdaki taraflarla paylaşılabilir:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Kargo firmaları:</strong> Ad, adres, telefon (teslimat için).</li>
              <li><strong>Ödeme kuruluşu (iyzico):</strong> Kart ödemesi için sadece işlem verileri.</li>
              <li><strong>SMS sağlayıcı (Netgsm):</strong> Telefon numarası, doğrulama/bilgilendirme mesajları.</li>
              <li><strong>E-posta sağlayıcı (Google SMTP):</strong> E-posta, işlem bildirimleri.</li>
              <li><strong>Altyapı sağlayıcı (Vercel, Supabase, Upstash):</strong> Site barındırma, veri depolama.</li>
              <li><strong>Muhasebeci / mali müşavir:</strong> Fatura ve vergi yükümlülükleri.</li>
              <li><strong>Yetkili kamu kurumları:</strong> Talep edilmesi halinde (mahkeme kararı, savcılık vs.).</li>
            </ul>
            <p className="mt-3"><strong>Yurt dışı aktarım:</strong> Barındırma ve altyapı hizmetleri (Vercel, Supabase, Upstash) için veriler KVKK m.9 uyarınca yeterli korumaya sahip ülkelerde tutulabilir; aksi durumlarda açık rızanıza başvurulur.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">6. SAKLAMA SÜRELERİ</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sipariş/fatura kayıtları: <strong>10 yıl</strong> (Türk Ticaret Kanunu m.82).</li>
              <li>Üyelik verileri: Hesap aktif olduğu süre boyunca + 3 yıl.</li>
              <li>Pazarlama izni verileri: İzin geri alınana dek + 1 yıl.</li>
              <li>Cilt analizi verileri: Analiz sonucunda hemen silinir; saklanmaz.</li>
              <li>Çerezler: Çerez türüne göre oturum süresi – 12 ay.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">7. HAKLARINIZ (KVKK m.11)</h2>
            <p>Veri sahibi olarak aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme.</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme.</li>
              <li>Verilerinizin işlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme.</li>
              <li>Yurt içi/yurt dışı aktarılan üçüncü tarafları bilme.</li>
              <li>Eksik/yanlış işlenmişse düzeltilmesini isteme.</li>
              <li>KVKK m.7'de öngörülen şartlarla silinmesini/yok edilmesini isteme.</li>
              <li>Yapılan işlemlerin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme.</li>
              <li>Otomatik sistemlerle analiz sonucu aleyhinize bir durum oluşmuşsa bu sonuca itiraz etme.</li>
              <li>Kanuna aykırı işleme nedeniyle zarara uğramışsanız tazminat talep etme.</li>
            </ul>
            <p className="mt-3"><strong>Başvuru yolu:</strong> Yukarıdaki haklarınızı kullanmak için, kimliğinizi tevsik edici belgelerle birlikte <a href="mailto:destek@gamzelidermokozmetik.com" className="text-rose-600 hover:underline">destek@gamzelidermokozmetik.com</a> adresine veya yukarıda belirtilen posta adresine yazılı olarak başvurabilirsiniz. Başvurunuz KVKK m.13 uyarınca en geç <strong>30 gün</strong> içinde sonuçlandırılır.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">8. GÜNCELLEME</h2>
            <p>Bu aydınlatma metni mevzuat değişiklikleri ve hizmet kapsamına göre güncellenebilir. Güncel versiyon bu sayfada yayımlanır. Son güncelleme: <strong>Nisan 2026</strong>.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
