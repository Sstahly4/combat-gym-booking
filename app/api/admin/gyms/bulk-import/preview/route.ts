/**
 * Admin: parse CSV and detect duplicate gyms (preview only, no writes).
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  attachDuplicates,
  buildParsedRowsFromGrid,
  parseCsvRows,
  toCatalogEntry,
} from '@/lib/admin/bulk-gym-import'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: { csv_text?: unknown; default_country?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const csv_text = typeof body.csv_text === 'string' ? body.csv_text : ''
  const default_country = typeof body.default_country === 'string' ? body.default_country : ''

  if (!csv_text.trim()) {
    return NextResponse.json({ error: 'csv_text is required' }, { status: 400 })
  }

  const grid = parseCsvRows(csv_text)
  const { rows: baseRows, header_error } = buildParsedRowsFromGrid(grid, default_country.trim())
  if (header_error) {
    return NextResponse.json({ error: header_error }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: gyms, error } = await admin
    .from('gyms')
    .select('id, name, city, country, google_maps_link, disciplines, verification_status')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const catalog = (gyms ?? []).map((g) => toCatalogEntry(g))
  const rows = attachDuplicates(baseRows, catalog)

  const with_errors = rows.filter((r) => r.errors.length > 0).length
  const with_duplicates = rows.filter((r) => r.duplicate_matches.length > 0).length

  return NextResponse.json({
    rows,
    stats: {
      total: rows.length,
      with_errors,
      with_duplicates,
      ready:
        rows.filter((r) => r.errors.length === 0 && r.duplicate_matches.length === 0).length,
    },
  })
}
