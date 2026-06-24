import { NextResponse } from 'next/server'
import { getLiveDestinationsCached } from '@/lib/search/live-destinations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/destinations
 * Live cities/countries with at least one public-listing gym — sorted by popularity (gym count).
 */
export async function GET() {
  const destinations = await getLiveDestinationsCached()
  return NextResponse.json(
    { destinations },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
  )
}
