import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AdminActivityItem } from '@/lib/admin/admin-activity-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Recent platform activity for the admin navbar bell (bookings + new gyms).
 * Uses service role after session admin check — do not expose without requireAdmin.
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error('[admin/activity-feed] admin client', e)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const since = new Date()
  since.setDate(since.getDate() - 21)

  const sinceIso = since.toISOString()

  const [bookingsRes, gymsRes, claimRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, created_at, status, total_price, gym_id, guest_name')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(45),
    supabase
      .from('gyms')
      .select('id, created_at, name, city, country, status, verification_status')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('owner_telemetry_events')
      .select('id, created_at, event_type, user_id, gym_id, metadata')
      .gte('created_at', sinceIso)
      .in('event_type', ['gym_claim_password_set'])
      .order('created_at', { ascending: false })
      .limit(25),
  ])

  if (bookingsRes.error) {
    console.error('[admin/activity-feed] bookings', bookingsRes.error)
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })
  }
  if (gymsRes.error) {
    console.error('[admin/activity-feed] gyms', gymsRes.error)
    return NextResponse.json({ error: 'Failed to load gyms' }, { status: 500 })
  }
  // Telemetry is best-effort; older environments may not have the table.
  if (claimRes.error) {
    const e = claimRes.error as unknown as { code?: string; message?: string }
    const msg = typeof e?.message === 'string' ? e.message : ''
    const missing =
      e?.code === 'PGRST205' || (/Could not find the table/i.test(msg) && /owner_telemetry_events/i.test(msg))
    if (!missing) {
      console.error('[admin/activity-feed] claim telemetry', claimRes.error)
    }
  }

  const bookingRows = (bookingsRes.data || []) as {
    id: string
    created_at: string
    status: string | null
    total_price: number | null
    gym_id: string
    guest_name: string | null
  }[]

  const gymIds = [...new Set(bookingRows.map((b) => b.gym_id).filter(Boolean))]
  const gymMeta = new Map<string, { name: string; city: string | null; country: string | null }>()
  if (gymIds.length > 0) {
    const { data: gymRows, error: gymLookupErr } = await supabase
      .from('gyms')
      .select('id, name, city, country')
      .in('id', gymIds)
    if (gymLookupErr) {
      console.error('[admin/activity-feed] gym lookup', gymLookupErr)
    } else {
      for (const g of gymRows || []) {
        gymMeta.set(g.id as string, {
          name: (g.name as string) || '',
          city: (g.city as string | null) ?? null,
          country: (g.country as string | null) ?? null,
        })
      }
    }
  }

  const items: AdminActivityItem[] = []

  for (const r of bookingRows) {
    const gm = gymMeta.get(r.gym_id)
    const gymName = gm?.name?.trim() || null
    const loc =
      gm?.city && gm?.country ? `${gm.city}, ${gm.country}` : gm?.country || gm?.city || null
    const guest = r.guest_name?.trim()
    const subtitleParts = [
      gymName,
      loc,
      guest ? `Guest: ${guest}` : null,
      r.status ? `Status: ${r.status}` : null,
    ].filter(Boolean)
    items.push({
      kind: 'booking',
      id: r.id,
      created_at: r.created_at,
      title: 'New booking',
      subtitle: subtitleParts.length ? subtitleParts.join(' · ') : null,
      href: `/admin/bookings?booking_id=${encodeURIComponent(r.id)}`,
      gym_name: gymName,
      status: r.status,
    })
  }

  for (const row of gymsRes.data || []) {
    const g = row as {
      id: string
      created_at: string
      name: string
      city: string | null
      country: string | null
      status: string | null
      verification_status: string | null
    }
    const loc = g.city && g.country ? `${g.city}, ${g.country}` : g.country || g.city || null
    items.push({
      kind: 'gym_new',
      id: g.id,
      created_at: g.created_at,
      title: 'New gym listing',
      subtitle: [g.name, loc, g.verification_status, g.status].filter(Boolean).join(' · ') || null,
      href: `/admin/gyms?gym_id=${encodeURIComponent(g.id)}`,
      gym_name: g.name,
      status: g.status,
    })
  }

  const claimRows = (!claimRes.error ? (claimRes.data || []) : []) as {
    id: string
    created_at: string
    event_type: string
    user_id: string | null
    gym_id: string | null
    metadata: any
  }[]

  const claimGymIds = [...new Set(claimRows.map((r) => r.gym_id).filter(Boolean))] as string[]
  const claimUserIds = [...new Set(claimRows.map((r) => r.user_id).filter(Boolean))] as string[]

  const claimGymMeta = new Map<string, { name: string; city: string | null; country: string | null }>()
  if (claimGymIds.length > 0) {
    const { data: rows } = await supabase.from('gyms').select('id, name, city, country').in('id', claimGymIds)
    for (const g of rows || []) {
      claimGymMeta.set(g.id as string, {
        name: (g.name as string) || '',
        city: (g.city as string | null) ?? null,
        country: (g.country as string | null) ?? null,
      })
    }
  }

  const claimOwnerMeta = new Map<string, { full_name: string | null }>()
  if (claimUserIds.length > 0) {
    const { data: rows } = await supabase.from('profiles').select('id, full_name').in('id', claimUserIds)
    for (const p of rows || []) {
      claimOwnerMeta.set(p.id as string, { full_name: (p.full_name as string | null) ?? null })
    }
  }

  for (const r of claimRows) {
    const gym = r.gym_id ? claimGymMeta.get(r.gym_id) : null
    const gymName = gym?.name?.trim() || null
    const loc =
      gym?.city && gym?.country ? `${gym.city}, ${gym.country}` : gym?.country || gym?.city || null
    const ownerName = r.user_id ? claimOwnerMeta.get(r.user_id)?.full_name?.trim() : null
    const subtitle = [ownerName ? `Owner: ${ownerName}` : null, loc].filter(Boolean).join(' · ') || null
    const href = r.gym_id ? `/admin/orphan-gyms?gym_id=${encodeURIComponent(r.gym_id)}` : '/admin/orphan-gyms'
    items.push({
      kind: 'owner_claimed',
      id: r.id,
      created_at: r.created_at,
      title: 'Claim link completed',
      subtitle,
      href,
      gym_name: gymName,
      status: null,
    })
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const merged = items.slice(0, 40)

  return NextResponse.json({ items: merged })
}
