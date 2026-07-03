'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { BookingModal } from '@/components/booking-modal'
import { DateRangePicker } from '@/components/date-range-picker'
import { useCurrency } from '@/lib/contexts/currency-context'
import { calculatePackagePrice } from '@/lib/utils'
import type { Gym } from '@/lib/types/database'
import { DATES_CONFIRMED_QUERY } from '@/lib/booking-dates-intent'
import { useBooking } from '@/lib/contexts/booking-context'
import { useGymAvailability } from '@/lib/hooks/use-gym-availability'
import { AlertCircle } from 'lucide-react'

export function BookingSection({ gym }: { gym: Gym }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const { convertPrice, formatPrice } = useCurrency()
  const { isDateBlocked } = useGymAvailability(gym.id, gym.verification_status !== 'draft')
  const {
    selectedPackage,
    checkin,
    setCheckin,
    checkout,
    setCheckout,
  } = useBooking()

  const pushConfirmedDatesToUrl = (cin: string, cout: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (cin) params.set('checkin', cin)
    else params.delete('checkin')
    if (cout) params.set('checkout', cout)
    else params.delete('checkout')
    params.set(DATES_CONFIRMED_QUERY, 'true')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const duration =
    checkin && checkout
      ? Math.floor(
          (new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0

  const rangeIsNonNegative = duration >= 0
  const isTraining = selectedPackage?.type === 'training'
  const isAllInclusive = selectedPackage?.type === 'all_inclusive'

  const isValidDuration = isTraining ? rangeIsNonNegative : duration > 0

  const pricingDuration =
    selectedPackage && isValidDuration && (isTraining || isAllInclusive)
      ? duration + 1
      : duration

  const priceInfo =
    selectedPackage && isValidDuration
      ? calculatePackagePrice(pricingDuration, selectedPackage.type, {
          daily: selectedPackage.price_per_day,
          weekly: selectedPackage.price_per_week,
          monthly: selectedPackage.price_per_month,
        })
      : null

  const totalPrice = priceInfo?.price || 0
  const minStay = selectedPackage?.min_stay_days ?? (selectedPackage?.type === 'training' ? 1 : 7)
  const durationForMinStay = selectedPackage?.type === 'training' ? pricingDuration : duration
  const showMinStayWarning = selectedPackage && durationForMinStay < minStay && isValidDuration
  const meetsMinimumStay = !selectedPackage || durationForMinStay >= minStay

  return (
    <>
      <Card className="sticky top-4 overflow-hidden border-0 bg-white shadow-lg">
        <CardHeader className="bg-[#febb02] pb-6 pt-6 text-[#003580]">
          {!selectedPackage ? (
            <>
              <CardTitle className="text-xl">Check Availability</CardTitle>
              <CardDescription className="text-[#003580]/80">
                Select dates and a package to see pricing
              </CardDescription>
            </>
          ) : !isValidDuration ? (
            <>
              <CardTitle className="text-xl">{selectedPackage.name}</CardTitle>
              <CardDescription className="text-[#003580]/80">
                Select dates to see total price
              </CardDescription>
            </>
          ) : (
            <>
              <CardDescription className="mb-1 text-xs font-medium uppercase tracking-wider text-[#003580]/80">
                Total Estimate {priceInfo ? `(${priceInfo.durationLabel})` : ''}
              </CardDescription>
              <CardTitle className="text-3xl">
                {formatPrice(convertPrice(totalPrice, gym.currency))}
              </CardTitle>
              <CardDescription className="mt-1 text-xs text-[#003580]/80">
                {selectedPackage.name}
                {showMinStayWarning ? (
                  <span className="mt-1 block font-medium text-orange-600">
                    Minimum stay: {minStay} {minStay === 1 ? 'day' : 'days'}
                  </span>
                ) : null}
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <DateRangePicker
              checkin={checkin}
              checkout={checkout}
              onCheckinChange={(v) => {
                setCheckin(v)
                pushConfirmedDatesToUrl(v, checkout)
              }}
              onCheckoutChange={(v) => {
                setCheckout(v)
                pushConfirmedDatesToUrl(checkin, v)
              }}
              isDateBlocked={isDateBlocked}
              mode={isTraining ? 'single' : 'range'}
            />
          </div>

          <div className="space-y-3 pt-2">
            {!selectedPackage ? (
              <div className="mb-2 flex items-center gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                <AlertCircle className="h-4 w-4" />
                Please select a package below
              </div>
            ) : null}

            {showMinStayWarning ? (
              <div className="mb-2 flex items-center gap-2 rounded-md bg-orange-50 p-3 text-sm text-orange-800">
                <AlertCircle className="h-4 w-4" />
                This package requires a minimum stay of {minStay} {minStay === 1 ? 'day' : 'days'}
              </div>
            ) : null}

            {gym.verification_status === 'draft' ? (
              <div className="mb-2 flex items-center gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                This gym is not yet verified and cannot accept bookings
              </div>
            ) : null}
            <Button
              className="h-12 w-full bg-[#003580] text-lg font-bold shadow-sm hover:bg-[#003580]/90"
              onClick={() => setBookingModalOpen(true)}
              disabled={
                !selectedPackage ||
                !isValidDuration ||
                !meetsMinimumStay ||
                gym.verification_status === 'draft'
              }
            >
              Request Booking
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              You won&apos;t be charged yet. Availability confirmed by gym.
            </p>
          </div>
        </CardContent>
      </Card>

      <BookingModal
        gym={gym}
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        initialData={{
          checkin,
          checkout,
          packageId: selectedPackage?.id,
          packageVariantId: (selectedPackage as { variant_id?: string })?.variant_id,
          packageName: selectedPackage?.name,
          variantName: (selectedPackage as { variant_name?: string })?.variant_name,
          estimatedPrice: totalPrice,
          priceBreakdown: priceInfo,
          packageType: selectedPackage?.type,
          pricingDuration,
        }}
      />
    </>
  )
}
