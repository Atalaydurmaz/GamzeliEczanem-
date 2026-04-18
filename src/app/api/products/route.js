import { getProducts } from '@/lib/products'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const kategori = searchParams.get('kategori') || undefined
  try {
    const data = await getProducts({ kategori })
    return Response.json(data, {
      headers: {
        // Ürün meta verisi nadiren değişir; stok ayrıca /api/stock üzerinden
        // StockContext tarafından canlı çekilip UI'yi override ediyor.
        // Vercel edge cache'e 60s ver, 600s stale-while-revalidate ile
        // admin güncellemesi sonrası hızla tazelensin.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
      },
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
