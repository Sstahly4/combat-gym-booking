/**
 * Admin: summary of what will be affected if a gym is permanently deleted.
 * Used by the multi-step delete UI on /manage/gym/edit.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

interface Params {
  params: { id: string }
}

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const gymId = params.id
  if (!gymId) {
    return NextResponse.json({ error: 'Gym id is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: gym, error: gymErr } = await admin
    .from('gyms')
    .select('id, name, city, country')
    .eq('id', gymId)
    .maybeSingle()

  if (gymErr || !gym) {
    return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
  }

  const [
    { count: bookingCount },
    { count: packageCount },
    { count: imageCount },
    { count: savedCount },
  ] = await Promise.all([
    admin.from('bookings').select('id', { count: 'exact', head: true }).eq('gym_id', gymId),
    admin.from('packages').select('id', { count: 'exact', head: true }).eq('gym_id', gymId),
    admin.from('gym_images').select('id', { count: 'exact', head: true }).eq('gym_id', gymId),
    admin.from('saved_gyms').select('gym_id', { count: 'exact', head: true }).eq('gym_id', gymId),
  ])

  return NextResponse.json({
    gym: {
      id: gym.id,
      name: gym.name,
      city: gym.city,
      country: gym.country,
    },
    counts: {
      bookings: bookingCount ?? 0,
      packages: packageCount ?? 0,
      images: imageCount ?? 0,
      saved_by_users: savedCount ?? 0,
    },
  })
}
