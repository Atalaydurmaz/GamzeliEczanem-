import { getStats } from '@/lib/reviews'

export async function GET() {
  return Response.json(getStats())
}
