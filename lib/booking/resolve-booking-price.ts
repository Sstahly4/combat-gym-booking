import type { SupabaseClient } from '@supabase/supabase-js'
import { computeBookingPriceFromDates, type PriceBreakdown } from '@/lib/booking/recalculate-booking-price'
import { computeBookingPriceWithSeasons } from '@/lib/booking/resolve-seasonal-prices'
import type { Package, PackageSeasonalRate, PackageVariant } from '@/lib/types/database'

export type ResolveBookingPriceResult =
  | {
      ok: true
      breakdown: PriceBreakdown
      totalPrice: number
      package: Pick<
        Package,
        'type' | 'price_per_day' | 'price_per_week' | 'price_per_month' | 'booking_mode'
      >
      variant: Pick<
        PackageVariant,
        'price_per_day' | 'price_per_week' | 'price_per_month'
      > | null
    }
  | { ok: false; status: number; error: string }

type PackagePricingRow = Pick<
  Package,
  | 'gym_id'
  | 'type'
  | 'price_per_day'
  | 'price_per_week'
  | 'price_per_month'
  | 'booking_mode'
> & { id: string }

type VariantPricingRow = Pick<
  PackageVariant,
  'id' | 'price_per_day' | 'price_per_week' | 'price_per_month'
>

type FetchedVariantRow = VariantPricingRow & Pick<PackageVariant, 'package_id'>

/** Shared pricing path for create + checkout date updates. */
export function computeBreakdownForStay(
  packageId: string,
  pkg: Pick<
    Package,
    'type' | 'price_per_day' | 'price_per_week' | 'price_per_month'
  >,
  variant: (VariantPricingRow & Partial<Pick<PackageVariant, 'once_daily_price_per_day' | 'once_daily_price_per_week' | 'once_daily_price_per_month'>>) | null,
  seasonalRates: PackageSeasonalRate[],
  startDate: string,
  endDate: string,
  training_tier: 'once_daily' | 'twice_daily' = 'twice_daily'
): PriceBreakdown | null {
  const tier = training_tier === 'once_daily' ? 'once_daily' : 'twice_daily'

  // When once_daily is requested, use the once-daily track where configured, otherwise fall back.
  const tierVariant =
    tier === 'once_daily' && variant
      ? {
          ...variant,
          price_per_day: (variant as any).once_daily_price_per_day ?? variant.price_per_day,
          price_per_week: (variant as any).once_daily_price_per_week ?? variant.price_per_week,
          price_per_month: (variant as any).once_daily_price_per_month ?? variant.price_per_month,
        }
      : variant

  const tierSeasonalRates =
    tier === 'once_daily'
      ? seasonalRates.map((r) => ({
          ...r,
          price_per_day: (r as any).once_daily_price_per_day ?? r.price_per_day,
          price_per_week: (r as any).once_daily_price_per_week ?? r.price_per_week,
          price_per_month: (r as any).once_daily_price_per_month ?? r.price_per_month,
        }))
      : seasonalRates

  if (seasonalRates.length > 0) {
    return computeBookingPriceWithSeasons(
      startDate,
      endDate,
      {
        id: packageId,
        type: pkg.type,
        price_per_day: pkg.price_per_day,
        price_per_week: pkg.price_per_week,
        price_per_month: pkg.price_per_month,
      },
      tierSeasonalRates,
      tierVariant
    )
  }
  return computeBookingPriceFromDates(startDate, endDate, pkg, tierVariant as any)
}

/**
 * Server-side source of truth for booking totals. Fetches package/variant rows,
 * validates they belong to the gym, and runs the shared pricing engine.
 */
export async function resolveBookingPrice(
  supabase: SupabaseClient,
  input: {
    gymId: string
    packageId: string
    packageVariantId?: string | null
    startDate: string
    endDate: string
    trainingTier?: 'once_daily' | 'twice_daily' | null
  }
): Promise<ResolveBookingPriceResult> {
  const { gymId, packageId, packageVariantId, startDate, endDate, trainingTier } = input
  const resolvedTier = trainingTier === 'once_daily' ? 'once_daily' : 'twice_daily'

  if (!packageId) {
    return { ok: false, status: 400, error: 'package_id is required' }
  }

  if (new Date(endDate) <= new Date(startDate)) {
    return { ok: false, status: 400, error: 'checkout must be after checkin' }
  }

  const { data: packageData, error: pkgError } = await supabase
    .from('packages')
    .select('id, gym_id, type, price_per_day, price_per_week, price_per_month, booking_mode')
    .eq('id', packageId)
    .single()

  if (pkgError || !packageData) {
    return { ok: false, status: 404, error: 'Package not found' }
  }

  const pkg = packageData as PackagePricingRow
  if (pkg.gym_id !== gymId) {
    return { ok: false, status: 400, error: 'Package does not belong to this gym' }
  }

  let variant: VariantPricingRow | null = null
  if (packageVariantId) {
    const { data: variantData, error: variantError } = await supabase
      .from('package_variants')
        .select('id, package_id, price_per_day, price_per_week, price_per_month, once_daily_price_per_day, once_daily_price_per_week, once_daily_price_per_month')
      .eq('id', packageVariantId)
      .single()

    if (variantError || !variantData) {
      return { ok: false, status: 404, error: 'Package variant not found' }
    }

    const fetchedVariant = variantData as FetchedVariantRow
    if (fetchedVariant.package_id !== packageId) {
      return { ok: false, status: 400, error: 'Package variant does not belong to this package' }
    }
    variant = fetchedVariant
  }

  const { data: seasonalRows } = await supabase
    .from('package_seasonal_rates')
    .select('*')
    .eq('package_id', packageId)
    .lte('start_date', endDate)
    .gte('end_date', startDate)

  const seasonalRates = (seasonalRows ?? []) as PackageSeasonalRate[]

  const breakdown = computeBreakdownForStay(
    packageId,
    pkg,
    variant,
    seasonalRates,
    startDate,
    endDate,
    resolvedTier
  )
  if (!breakdown) {
    return { ok: false, status: 400, error: 'Invalid date range for pricing' }
  }

  if (breakdown.price < 0 || !Number.isFinite(breakdown.price)) {
    return { ok: false, status: 400, error: 'Invalid price for selected dates' }
  }

  const totalPrice = Number(breakdown.price.toFixed(2))

  return {
    ok: true,
    breakdown,
    totalPrice,
    package: {
      type: pkg.type,
      price_per_day: pkg.price_per_day,
      price_per_week: pkg.price_per_week,
      price_per_month: pkg.price_per_month,
      booking_mode: pkg.booking_mode,
    },
    variant: variant
      ? {
          price_per_day: variant.price_per_day,
          price_per_week: variant.price_per_week,
          price_per_month: variant.price_per_month,
        }
      : null,
  }
}
