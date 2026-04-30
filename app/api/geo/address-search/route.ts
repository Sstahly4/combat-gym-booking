import { NextRequest, NextResponse } from 'next/server'
import {
  buildNominatimAddressQueries,
  parseCityFromNominatimAddress,
  type NominatimSearchHit,
} from '@/lib/geo/nominatim-address'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 3) {
    return NextResponse.json({ results: [] as const })
  }
  if (q.length > 400) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 })
  }

  try {
    let raw: NominatimSearchHit[] = []
    for (const query of buildNominatimAddressQueries(q)) {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '8',
        addressdetails: '1',
        'accept-language': 'en',
      })

      const res = await fetch(`${NOMINATIM}?${params.toString()}`, {
        headers: {
          'User-Agent': 'CombatStay/1.0 (https://combatstay.com)',
        },
        next: { revalidate: 0 },
      })

      if (!res.ok) {
        return NextResponse.json(
          { error: 'Address search temporarily unavailable' },
          { status: res.status >= 500 ? 502 : res.status }
        )
      }

      const nextRaw = (await res.json()) as NominatimSearchHit[]
      if (!Array.isArray(nextRaw)) {
        return NextResponse.json({ results: [] as const })
      }
      if (nextRaw.length > 0) {
        raw = nextRaw
        break
      }
    }

    const results = raw
      .filter((row) => row.lat && row.lon && row.display_name)
      .map((row) => {
        const city = parseCityFromNominatimAddress(row.address)
        return {
          display_name: row.display_name,
          lat: row.lat,
          lon: row.lon,
          city,
          country: row.address?.country ?? null,
        }
      })

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Address search failed' }, { status: 502 })
  }
}
