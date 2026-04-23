/**
 * Admin: apply bulk gym import after preview (idempotent per batch_id).
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidateGymCache } from '@/lib/seo/revalidate-gym'
import {
  attachDuplicates,
  buildParsedRowsFromGrid,
  parseCsvRows,
  resolutionValidForRow,
  toCatalogEntry,
  type BulkImportParsedRow,
  type BulkImportRowResolution,
} from '@/lib/admin/bulk-gym-import'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(s: string): boolean {
  return UUID_RE.test(s)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: {
    batch_id?: unknown
    csv_text?: unknown
    default_country?: unknown
    resolutions?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const batch_id = typeof body.batch_id === 'string' ? body.batch_id.trim() : ''
  const csv_text = typeof body.csv_text === 'string' ? body.csv_text : ''
  const default_country = typeof body.default_country === 'string' ? body.default_country : ''
  const resolutionsRaw = body.resolutions

  if (!batch_id || !isUuid(batch_id)) {
    return NextResponse.json({ error: 'batch_id must be a UUID' }, { status: 400 })
  }
  if (!csv_text.trim()) {
    return NextResponse.json({ error: 'csv_text is required' }, { status: 400 })
  }
  if (!Array.isArray(resolutionsRaw)) {
    return NextResponse.json({ error: 'resolutions must be an array' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: priorBatch, error: priorErr } = await admin
    .from('gym_bulk_import_batches')
    .select('summary')
    .eq('id', batch_id)
    .maybeSingle()

  if (priorErr) {
    return NextResponse.json({ error: priorErr.message }, { status: 500 })
  }
  if (priorBatch) {
    return NextResponse.json({
      already_committed: true as const,
      summary: priorBatch.summary,
    })
  }

  const { error: delOrphansErr } = await admin
    .from('gyms')
    .delete()
    .eq('bulk_import_batch_id', batch_id)
    .eq('owner_id', auth.user.id)

  if (delOrphansErr) {
    return NextResponse.json({ error: delOrphansErr.message }, { status: 500 })
  }

  const grid = parseCsvRows(csv_text)
  const { rows: baseRows, header_error } = buildParsedRowsFromGrid(grid, default_country.trim())
  if (header_error) {
    return NextResponse.json({ error: header_error }, { status: 400 })
  }

  const { data: gyms, error: gymErr } = await admin
    .from('gyms')
    .select('id, name, city, country, google_maps_link, disciplines, verification_status')

  if (gymErr) {
    return NextResponse.json({ error: gymErr.message }, { status: 500 })
  }

  const catalog = (gyms ?? []).map((g) => toCatalogEntry(g))
  const rows = attachDuplicates(baseRows, catalog)

  const resolutions: BulkImportRowResolution[] = []
  for (const item of resolutionsRaw) {
    if (!item || typeof item !== 'object') {
      return NextResponse.json({ error: 'Each resolution must be an object' }, { status: 400 })
    }
    const o = item as Record<string, unknown>
    const row_index = typeof o.row_index === 'number' ? o.row_index : Number(o.row_index)
    const action = o.action
    const existing_gym_id = typeof o.existing_gym_id === 'string' ? o.existing_gym_id : undefined
    if (!Number.isInteger(row_index) || row_index < 1) {
      return NextResponse.json({ error: 'Invalid row_index in resolutions' }, { status: 400 })
    }
    if (
      action !== 'create' &&
      action !== 'skip' &&
      action !== 'update' &&
      action !== 'create_anyway'
    ) {
      return NextResponse.json({ error: 'Invalid action in resolutions' }, { status: 400 })
    }
    resolutions.push({
      row_index,
      action,
      existing_gym_id,
    })
  }

  const resByIndex = new Map<number, BulkImportRowResolution>()
  for (const r of resolutions) {
    if (resByIndex.has(r.row_index)) {
      return NextResponse.json(
        { error: `Duplicate resolution for row_index ${r.row_index}` },
        { status: 400 },
      )
    }
    resByIndex.set(r.row_index, r)
  }

  for (const row of rows) {
    if (!resByIndex.has(row.rowIndex)) {
      return NextResponse.json(
        { error: `Missing resolution for spreadsheet row ${row.rowIndex}` },
        { status: 400 },
      )
    }
  }
  for (const r of resolutions) {
    if (!rows.some((row) => row.rowIndex === r.row_index)) {
      return NextResponse.json(
        { error: `Resolution references unknown row_index ${r.row_index}` },
        { status: 400 },
      )
    }
  }

  for (const row of rows) {
    const res = resByIndex.get(row.rowIndex)!
    if (row.errors.length > 0) {
      return NextResponse.json(
        { error: `Row ${row.rowIndex} has parse errors; fix the CSV and preview again.` },
        { status: 400 },
      )
    }
    const v = resolutionValidForRow(row, res)
    if (v) {
      return NextResponse.json({ error: `Row ${row.rowIndex}: ${v}` }, { status: 400 })
    }
  }

  const created_ids: string[] = []
  const updated_ids: string[] = []
  const skipped_row_indexes: number[] = []

  const insertPayload = (row: BulkImportParsedRow) => ({
    owner_id: auth.user.id,
    name: row.name,
    description: null as string | null,
    address: null as string | null,
    city: row.city,
    country: row.country,
    disciplines: row.disciplines,
    offers_accommodation: false,
    google_maps_link: row.google_maps_link,
    instagram_link: null as string | null,
    facebook_link: null as string | null,
    amenities: {} as Record<string, unknown>,
    status: 'pending' as const,
    verification_status: 'draft' as const,
    stripe_connect_verified: false,
    admin_approved: false,
    price_per_day: 0,
    currency: 'USD',
    bulk_import_batch_id: batch_id,
  })

  const rollbackCreates = async () => {
    if (created_ids.length === 0) return
    await admin.from('gyms').delete().in('id', created_ids)
  }

  try {
    for (const row of rows) {
      const res = resByIndex.get(row.rowIndex)!
      if (res.action === 'skip') {
        skipped_row_indexes.push(row.rowIndex)
        continue
      }
      if (res.action === 'update' && res.existing_gym_id) {
        const { error: upErr } = await admin
          .from('gyms')
          .update({
            name: row.name,
            city: row.city,
            country: row.country,
            google_maps_link: row.google_maps_link,
            disciplines: row.disciplines,
          })
          .eq('id', res.existing_gym_id)

        if (upErr) {
          await rollbackCreates()
          return NextResponse.json({ error: upErr.message }, { status: 500 })
        }
        updated_ids.push(res.existing_gym_id)
        revalidateGymCache(res.existing_gym_id)
      }
    }

    for (const row of rows) {
      const res = resByIndex.get(row.rowIndex)!
      if (res.action === 'skip' || res.action === 'update') continue
      if (res.action !== 'create' && res.action !== 'create_anyway') continue

      const { data: created, error: insErr } = await admin
        .from('gyms')
        .insert(insertPayload(row))
        .select('id')
        .single()

      if (insErr || !created?.id) {
        await rollbackCreates()
        return NextResponse.json(
          { error: insErr?.message || 'Insert failed' },
          { status: 500 },
        )
      }
      created_ids.push(created.id)
      revalidateGymCache(created.id)
    }

    const summary = {
      created_ids,
      updated_ids,
      skipped_row_indexes,
      created_count: created_ids.length,
      updated_count: updated_ids.length,
      skipped_count: skipped_row_indexes.length,
    }

    const { error: batchErr } = await admin.from('gym_bulk_import_batches').insert({
      id: batch_id,
      admin_user_id: auth.user.id,
      summary,
    })

    if (batchErr) {
      if (batchErr.code === '23505') {
        const { data: existing } = await admin
          .from('gym_bulk_import_batches')
          .select('summary')
          .eq('id', batch_id)
          .maybeSingle()
        await rollbackCreates()
        return NextResponse.json({
          already_committed: true as const,
          summary: existing?.summary ?? summary,
        })
      }
      await rollbackCreates()
      return NextResponse.json({ error: batchErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true as const, summary })
  } catch (e) {
    await rollbackCreates()
    const message = e instanceof Error ? e.message : 'Commit failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
