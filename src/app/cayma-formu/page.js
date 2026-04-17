export const metadata = {
  title: 'Cayma Formu – GAMZELİECZANEM',
  description: 'Mesafeli Sözleşmeler Yönetmeliği EK-1 kapsamında örnek cayma bildirim formu.',
}

export default function CaymaFormu() {
  return (
    <div className="min-h-screen">
      <div className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Cayma Formu</h1>
          <p className="text-stone-500 text-sm">Mesafeli Sözleşmeler Yönetmeliği EK-1</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-6 text-sm text-stone-700 leading-relaxed">

          <section>
            <p>Bu formu sözleşmeden cayma hakkınızı kullanmak istiyorsanız doldurup tarafımıza iletmeniz gerekmektedir.</p>
            <p className="mt-2"><strong>Cayma süresi:</strong> Ürün teslim tarihinden itibaren <strong>14 (on dört) gün</strong>.</p>
          </section>

          <section className="bg-rose-50 border border-rose-100 rounded-xl p-5">
            <h2 className="text-base font-bold text-stone-900 mb-3">Gönderim Bilgileri</h2>
            <div className="space-y-1 text-sm">
              <p><strong>Alıcı:</strong> ATALAY DURMAZ (GAMZELİECZANEM)</p>
              <p><strong>Adres:</strong> Yüzbaşılar Mah. 3013. Sk. D Blok No:2D İç Kapı No:7, Gölcük / Kocaeli</p>
              <p><strong>Tel:</strong> 0262 412 6928</p>
              <p><strong>E-posta:</strong> destek.gamzelieczanem@gmail.com</p>
            </div>
          </section>

          <section className="bg-white border border-stone-200 rounded-xl p-5">
            <h2 className="text-base font-bold text-stone-900 mb-4">Form Metni</h2>
            <div className="space-y-4 text-sm">
              <p>Bu formu yalnızca sözleşmeden cayma hakkınızı kullanmak istiyorsanız doldurup geri gönderiniz.</p>

              <p>Kendi adına veya bu konuda yetki verdiği temsilcisi aracılığıyla ATALAY DURMAZ'a (GAMZELİECZANEM) hitaben:</p>

              <p>Bu formla aşağıdaki ürünlerin satışına ilişkin mesafeli sözleşmeden cayma hakkımı kullandığımı beyan ederim.</p>

              <div className="space-y-2 pt-2 border-t border-stone-200">
                <p>– Sipariş tarihi / alım tarihi: ..................................................</p>
                <p>– Sipariş numarası: ..................................................</p>
                <p>– Cayılan ürünler: ..................................................</p>
                <p>– Tüketicinin adı ve soyadı: ..................................................</p>
                <p>– Tüketicinin adresi: ..................................................</p>
                <p>– Tüketicinin imzası (formun kağıt olarak gönderilmesi halinde): ..................................................</p>
                <p>– Tarih: ..................................................</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-3">Nasıl İletebilirim?</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>E-posta ile:</strong> Yukarıdaki bilgileri doldurup <a href="mailto:destek.gamzelieczanem@gmail.com" className="text-rose-600 hover:underline">destek.gamzelieczanem@gmail.com</a> adresine gönderebilirsiniz.</li>
              <li><strong>Yazılı olarak:</strong> Doldurduğunuz formu yukarıdaki Satıcı adresine postalayabilirsiniz.</li>
              <li><strong>Sipariş üzerinden:</strong> "Hesabım → Siparişlerim → Sipariş Detay" ekranından "İade Talebi Oluştur" butonu ile başvurabilirsiniz.</li>
            </ul>
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h2 className="text-base font-bold text-amber-900 mb-2">⚠️ Cayma Hakkının Kullanılamayacağı Haller</h2>
            <p className="text-sm text-amber-900">Mesafeli Sözleşmeler Yönetmeliği m.15 uyarınca, <strong>tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış</strong>; iadesi sağlık ve hijyen açısından uygun olmayan kozmetik/makyaj/cilt bakım ürünlerinde cayma hakkı kullanılamaz.</p>
          </section>

          <section>
            <p className="text-xs text-stone-500">Cayma bildiriminiz ve ürünün tarafımıza ulaşmasından itibaren <strong>14 gün</strong> içinde, ödeme hangi araçla yapıldıysa aynı araçla bedel iadesi gerçekleştirilir.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
