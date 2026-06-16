import type { SupabaseClient } from '@supabase/supabase-js'
import { computeBookingPriceFromDates, type PriceBreakdown } from '@/lib/booking/recalculate-booking-price'
import type { Package, PackageVariant } from '@/lib/types/database'

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
>

type VariantPricingRow = Pick<
  PackageVariant,
  'package_id' | 'price_per_day' | 'price_per_week' | 'price_per_month'
>

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
  }
): Promise<ResolveBookingPriceResult> {
  const { gymId, packageId, packageVariantId, startDate, endDate } = input

  if (!packageId) {
    return { ok: false, status: 400, error: 'package_id is required' }
  }

  if (new Date(endDate) <= new Date(startDate)) {
    return { ok: false, status: 400, error: 'checkout must be after checkin' }
  }

  const { data: packageData, error: pkgError } = await supabase
    .from('packages')
    .select('gym_id, type, price_per_day, price_per_week, price_per_month, booking_mode')
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
      .select('package_id, price_per_day, price_per_week, price_per_month')
      .eq('id', packageVariantId)
      .single()

    if (variantError || !variantData) {
      return { ok: false, status: 404, error: 'Package variant not found' }
    }

    variant = variantData as VariantPricingRow
    if (variant.package_id !== packageId) {
      return { ok: false, status: 400, error: 'Package variant does not belong to this package' }
    }
  }

  const breakdown = computeBookingPriceFromDates(startDate, endDate, pkg, variant)
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
