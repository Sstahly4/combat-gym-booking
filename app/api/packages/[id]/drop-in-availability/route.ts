import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDropInAvailabilityRange } from '@/lib/packages/drop-in-capacity'
import { isDropInPackage } from '@/lib/packages/drop-in'

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Public drop-in availability for a package (sold-out dates for calendar UI).
 * GET /api/packages/[id]/drop-in-availability?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packageId = params.id
    const from = request.nextUrl.searchParams.get('from')?.trim() ?? todayISO()
    const to =
      request.nextUrl.searchParams.get('to')?.trim() ??
      addDaysISO(from, 365)

    if (!DATE_RX.test(from) || !DATE_RX.test(to)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }
    if (to < from) {
      return NextResponse.json({ error: 'to must be on or after from' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select('id, offer_type, daily_capacity, gym_id, gym:gyms(verification_status, status)')
      .eq('id', packageId)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    if (!isDropInPackage({ offer_type: pkg.offer_type })) {
      return NextResponse.json({ error: 'Not a drop-in package' }, { status: 400 })
    }

    const gym = pkg.gym as { verification_status?: string; status?: string } | null
    if (gym?.verification_status === 'draft' || gym?.status !== 'approved') {
      return NextResponse.json({ error: 'Package not available' }, { status: 404 })
    }

    const days = await getDropInAvailabilityRange(supabase, {
      packageId,
      dailyCapacity: pkg.daily_capacity,
      from,
      to,
    })

    return NextResponse.json({
      package_id: packageId,
      daily_capacity: pkg.daily_capacity,
      from,
      to,
      days,
      sold_out_dates: days.filter((d) => d.sold_out).map((d) => d.date),
    })
  } catch (e) {
    console.error('[drop-in-availability]', e)
    return NextResponse.json({ error: 'Failed to load availability' }, { status: 500 })
  }
}
