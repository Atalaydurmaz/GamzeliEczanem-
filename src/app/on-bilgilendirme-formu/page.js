export const metadata = {
  title: 'Ön Bilgilendirme Formu – GAMZELİECZANEM',
  description: 'GAMZELİECZANEM ön bilgilendirme formu — satıcı bilgileri, ürün, teslimat, cayma hakkı.',
}

export default function OnBilgilendirmeFormu() {
  return (
    <div className="min-h-screen">
      <div className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Ön Bilgilendirme Formu</h1>
          <p className="text-stone-500 text-sm">Son güncelleme: Nisan 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose prose-stone prose-sm max-w-none">
        <div className="space-y-8 text-sm text-stone-700 leading-relaxed">

          <section>
            <p>6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, Alıcı'nın mesafeli satış sözleşmesini kurmadan önce aşağıdaki hususlarda bilgilendirilmesi zorunludur.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">1. SATICI BİLGİLERİ</h2>
            <div className="space-y-1">
              <p>Ticaret Unvanı: ATALAY DURMAZ (Gerçek Kişilere Ait Ticari İşletme)</p>
              <p>Marka Adı: GAMZELİECZANEM</p>
              <p>MERSİS No: 1017857069400001</p>
              <p>Ticaret Sicil No: GÖLCÜK/6055</p>
              <p>Vergi Dairesi / VKN: Gölcük / 3160931792</p>
              <p>Adres: Yüzbaşılar Mah. 3013. Sk. D Blok No:2D İç Kapı No:7, Gölcük / Kocaeli</p>
              <p>Tel: 0262 412 6928</p>
              <p>E-posta: destek.gamzelieczanem@gmail.com</p>
              <p>Web: gamzelikozmetik.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">2. SÖZLEŞME KONUSU ÜRÜN/HİZMET</h2>
            <p>Sözleşme konusu ürün/ürünlerin temel nitelikleri, adedi, satış fiyatı (KDV dahil), ödeme şekli ve teslimat bilgileri; sipariş özetinde ve sipariş onay e-postasında yer alır. Listelenen ve sitede ilan edilen fiyatlar satış fiyatıdır. İlan edilen fiyatlar ve vaatler güncelleme yapılana ve değiştirilene kadar geçerlidir. Süreli olarak ilan edilen fiyatlar ise belirtilen süre sonuna kadar geçerlidir.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">3. ÖDEME BİLGİLERİ</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kredi/Banka Kartı ile online ödeme (iyzico altyapısı — kart bilgileri Satıcı tarafından saklanmaz).</li>
              <li>Havale/EFT.</li>
              <li>Kapıda ödeme (nakit/kart — bölge bazlı uygunluğa tabidir).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">4. TESLİMAT</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ürünler, sipariş ve ödeme onayından sonra en geç <strong>5 (beş) iş günü</strong> içinde Alıcı'nın belirttiği adrese anlaşmalı kargo firması aracılığıyla teslim edilir.</li>
              <li>Kargo ücreti sipariş özetinde ayrıca gösterilir. Belirli tutar üzerindeki siparişlerde kargo Satıcı tarafından karşılanabilir.</li>
              <li>Mücbir sebepler veya olağanüstü durumlarda bu süre aşılabilir; Alıcı bu durumda derhal bilgilendirilir.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">5. CAYMA HAKKI</h2>
            <p>Alıcı, teslim aldığı tarihten itibaren <strong>14 (on dört) gün</strong> içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.</p>
            <p className="mt-2"><strong>Cayma hakkının kullanılamayacağı haller:</strong></p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Tüketicinin istekleri veya açıkça onun kişisel ihtiyaçları doğrultusunda hazırlanan ürünler.</li>
              <li>Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler.</li>
              <li>Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan ürünlerden; iadesi sağlık ve hijyen açısından uygun olmayanlar (açılmış kozmetik, makyaj, cilt bakım ürünleri dahil).</li>
              <li>Tesliminden sonra başka ürünlerle karışan ve doğası gereği ayrıştırılması mümkün olmayan ürünler.</li>
            </ul>
            <p className="mt-2"><strong>Cayma bildirimi:</strong> destek.gamzelieczanem@gmail.com adresine e-posta ile veya yazılı olarak yukarıdaki Satıcı adresine yapılabilir.</p>
            <p className="mt-2"><strong>Bedel iadesi:</strong> Alıcı'nın cayma bildirimi ve iade edilen ürünün Satıcı'ya ulaşmasından itibaren <strong>14 gün</strong> içinde, ödeme hangi araçla yapıldıysa aynı araçla ve tek seferde iade edilir.</p>
            <p className="mt-2"><strong>İade kargosu:</strong> Anlaşmalı kargo firması (PTT Kargo / Yurtiçi Kargo) kullanıldığında iade kargo bedeli Satıcı'ya aittir. Anlaşmalı olmayan kargo firması kullanıldığında iade kargo bedeli Alıcı'ya aittir.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">6. UYUŞMAZLIK ÇÖZÜMÜ</h2>
            <p>Sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığı'nca her yıl belirlenen parasal sınırlar dahilinde Alıcı'nın mal veya hizmeti satın aldığı ve ikametgahının bulunduğu yerdeki <strong>İl/İlçe Tüketici Hakem Heyetleri</strong>; bu sınırın üzerindeki uyuşmazlıklarda <strong>Tüketici Mahkemeleri</strong> yetkilidir. Ayrıca <strong>e-Devlet</strong> üzerinden Tüketici Bilgi Sistemi (TÜBİS) aracılığıyla başvuru yapılabilir.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">7. ONAY</h2>
            <p>Alıcı, işbu Ön Bilgilendirme Formu'nu elektronik ortamda teyit etmekle, mesafeli sözleşmelerin akdedilmesinden önce Satıcı tarafından Tüketici'ye verilmesi gereken adres, siparişi verilen ürünlere ait temel özellikler, ürünlerin vergiler dahil fiyatı, ödeme ve teslimat bilgilerini de doğru ve eksiksiz olarak edindiğini teyit etmiş olur.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
