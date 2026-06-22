import type { SupabaseClient } from '@supabase/supabase-js'
import { computeBreakdownForStay } from '@/lib/booking/resolve-booking-price'
import { nightsBetween } from '@/lib/booking/recalculate-booking-price'
import type { Package, PackageSeasonalRate, PackageVariant } from '@/lib/types/database'

export type BookingPriceSnapshotInput = {
  bookingId: string
  searchSessionId?: string | null
  searchEventId?: string | null
  gymId: string
  packageId: string
  packageVariantId?: string | null
  startDate: string
  endDate: string
  trainingTier: 'once_daily' | 'twice_daily'
  currency?: string | null
  quotedTotal: number
}

type PackageRow = Pick<
  Package,
  | 'id'
  | 'type'
  | 'price_per_day'
  | 'price_per_week'
  | 'price_per_month'
  | 'once_daily_price_per_day'
  | 'once_daily_price_per_week'
  | 'once_daily_price_per_month'
>

type VariantRow = Pick<
  PackageVariant,
  | 'id'
  | 'price_per_day'
  | 'price_per_week'
  | 'price_per_month'
  | 'once_daily_price_per_day'
  | 'once_daily_price_per_week'
  | 'once_daily_price_per_month'
>

export function leadTimeDaysFromStart(startDateYmd: string, asOf = new Date()): number {
  const start = new Date(`${startDateYmd}T12:00:00`)
  const now = new Date(asOf)
  now.setHours(12, 0, 0, 0)
  return Math.max(0, Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

/**
 * Compute base (no seasonal), seasonal, and tier deltas for an immutable quote record.
 */
export async function buildBookingPriceSnapshotFields(
  supabase: SupabaseClient,
  input: Omit<BookingPriceSnapshotInput, 'bookingId' | 'searchSessionId' | 'searchEventId' | 'quotedTotal'>,
): Promise<{
  basePackageTotal: number
  seasonalPremiumApplied: number
  tierMultiplierDelta: number
  stayNights: number
  leadTimeDays: number
  snapshot: Record<string, unknown>
}> {
  const { packageId, packageVariantId, startDate, endDate, trainingTier } = input

  const { data: packageData } = await supabase
    .from('packages')
    .select(
      'id, type, price_per_day, price_per_week, price_per_month, once_daily_price_per_day, once_daily_price_per_week, once_daily_price_per_month',
    )
    .eq('id', packageId)
    .single()

  if (!packageData) {
    throw new Error('Package not found for price snapshot')
  }

  const pkg = packageData as PackageRow

  let variant: VariantRow | null = null
  if (packageVariantId) {
    const { data: variantData } = await supabase
      .from('package_variants')
      .select(
        'id, price_per_day, price_per_week, price_per_month, once_daily_price_per_day, once_daily_price_per_week, once_daily_price_per_month',
      )
      .eq('id', packageVariantId)
      .single()
    variant = (variantData as VariantRow) ?? null
  }

  const { data: seasonalRows } = await supabase
    .from('package_seasonal_rates')
    .select('*')
    .eq('package_id', packageId)
    .lte('start_date', endDate)
    .gte('end_date', startDate)

  const seasonalRates = (seasonalRows ?? []) as PackageSeasonalRate[]

  const baseTwiceDaily = computeBreakdownForStay(
    packageId,
    pkg,
    variant,
    [],
    startDate,
    endDate,
    'twice_daily',
  )
  const withSeasonTwiceDaily = computeBreakdownForStay(
    packageId,
    pkg,
    variant,
    seasonalRates,
    startDate,
    endDate,
    'twice_daily',
  )
  const withSeasonSelectedTier = computeBreakdownForStay(
    packageId,
    pkg,
    variant,
    seasonalRates,
    startDate,
    endDate,
    trainingTier,
  )
  const withSeasonOnceDaily =
    trainingTier === 'once_daily'
      ? withSeasonSelectedTier
      : computeBreakdownForStay(packageId, pkg, variant, seasonalRates, startDate, endDate, 'once_daily')

  const baseTotal = Number((baseTwiceDaily?.price ?? 0).toFixed(2))
  const seasonalTotal = Number((withSeasonTwiceDaily?.price ?? baseTotal).toFixed(2))
  const selectedTotal = Number((withSeasonSelectedTier?.price ?? seasonalTotal).toFixed(2))
  const onceDailyTotal = Number((withSeasonOnceDaily?.price ?? selectedTotal).toFixed(2))
  const twiceDailyTotal = Number((withSeasonTwiceDaily?.price ?? selectedTotal).toFixed(2))

  const seasonalPremiumApplied = Number(Math.max(0, seasonalTotal - baseTotal).toFixed(2))
  const tierMultiplierDelta =
    trainingTier === 'once_daily'
      ? Number((selectedTotal - twiceDailyTotal).toFixed(2))
      : Number((selectedTotal - onceDailyTotal).toFixed(2))

  const nights = nightsBetween(startDate, endDate)
  const stayNights = pkg.type === 'training' ? Math.max(1, nights + 1) : nights

  return {
    basePackageTotal: baseTotal,
    seasonalPremiumApplied,
    tierMultiplierDelta,
    stayNights,
    leadTimeDays: leadTimeDaysFromStart(startDate),
    snapshot: {
      version: 1,
      package_id: packageId,
      package_variant_id: packageVariantId ?? null,
      training_tier: trainingTier,
      base_twice_daily_total: baseTotal,
      seasonal_twice_daily_total: seasonalTotal,
      once_daily_total: onceDailyTotal,
      twice_daily_total: twiceDailyTotal,
      selected_total: selectedTotal,
      seasonal_rate_count: seasonalRates.length,
    },
  }
}

export async function insertBookingPriceSnapshot(
  supabase: SupabaseClient,
  input: BookingPriceSnapshotInput,
): Promise<void> {
  const fields = await buildBookingPriceSnapshotFields(supabase, input)

  const { error } = await supabase.from('booking_price_snapshots').insert({
    booking_id: input.bookingId,
    search_session_id: input.searchSessionId ?? null,
    search_event_id: input.searchEventId ?? null,
    gym_id: input.gymId,
    package_id: input.packageId,
    package_variant_id: input.packageVariantId ?? null,
    training_tier: input.trainingTier,
    currency: input.currency ?? null,
    base_package_total: fields.basePackageTotal,
    seasonal_premium_applied: fields.seasonalPremiumApplied,
    tier_multiplier_delta: fields.tierMultiplierDelta,
    quoted_total: Number(input.quotedTotal.toFixed(2)),
    lead_time_days: fields.leadTimeDays,
    stay_nights: fields.stayNights,
    snapshot: fields.snapshot,
  })

  if (error) {
    throw error
  }
}
