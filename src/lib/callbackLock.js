/**
 * Callback işleme kilidi — aynı Node.js instance'ında
 * eş zamanlı gelen duplicate iyzico callback'lerini engeller.
 *
 * Çalışma mantığı:
 *   - İlk istek: lock alır, işlemi başlatır, sonucu Map'te saklar.
 *   - Eş zamanlı ikinci istek: Map'te aynı paymentId'yi bulur,
 *     birinci isteğin Promise'ini bekler ve aynı sonucu döner.
 *
 * Kapsamı: tek bir Node.js process/instance.
 * Çapraz instance koruması: claimPendingOrder (DB-level DELETE atomicity).
 * Son savunma: createOrderAtomic UNIQUE constraint.
 */

// paymentId → Promise<Response> — modül ömrü boyunca sıcak tutulan Map
const inFlight = new Map()

/**
 * paymentId için lock alır. Zaten işleniyor ise o Promise'i döner.
 *
 * @param {string} paymentId
 * @param {() => Promise<T>} islem - Lock altında çalıştırılacak async fonksiyon
 * @returns {Promise<{ locked: false, sonuc: T } | { locked: true, sonuc: T }>}
 *   locked: true  → aynı paymentId başka bir istek tarafından işleniyordu, o sonuç döndü
 *   locked: false → bu istek kilidi aldı ve işlemi tamamladı
 */
export async function withCallbackLock(paymentId, islem) {
  // Zaten işleniyorsa o Promise'i bekle
  if (inFlight.has(paymentId)) {
    const sonuc = await inFlight.get(paymentId)
    return { locked: true, sonuc }
  }

  // Lock al: Promise'i Map'e koy, tamamlanınca kaldır
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  inFlight.set(paymentId, promise)

  try {
    const sonuc = await islem()
    resolve(sonuc)
    return { locked: false, sonuc }
  } catch (err) {
    reject(err)
    throw err
  } finally {
    inFlight.delete(paymentId)
  }
}
