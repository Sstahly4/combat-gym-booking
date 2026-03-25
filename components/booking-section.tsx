'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookingModal } from '@/components/booking-modal'
import { useCurrency } from '@/lib/contexts/currency-context'
import { calculatePackagePrice } from '@/lib/utils'
import type { Gym } from '@/lib/types/database'
import { useBooking } from '@/lib/contexts/booking-context'
import { AlertCircle } from 'lucide-react'

export function BookingSection({ gym }: { gym: Gym }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const { convertPrice, formatPrice } = useCurrency()
  const { 
    selectedPackage, 
    checkin, setCheckin, 
    checkout, setCheckout 
  } = useBooking()

  // Update URL when dates change
  useEffect(() => {
    if (checkin || checkout) {
      const params = new URLSearchParams(searchParams.toString())
      if (checkin) params.set('checkin', checkin)
      if (checkout) params.set('checkout', checkout)
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }, [checkin, checkout, router, searchParams])

  // Calculate duration
  const duration = (checkin && checkout) 
    ? Math.floor((new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const isValidDuration = duration > 0
  const pricingDuration =
    selectedPackage && isValidDuration && (selectedPackage.type === 'training' || selectedPackage.type === 'all_inclusive')
      ? duration + 1
      : duration

  // Calculate Price for Selected Package (respects billing units)
  const priceInfo = (selectedPackage && isValidDuration)
    ? calculatePackagePrice(pricingDuration, selectedPackage.type, {
        daily: selectedPackage.price_per_day,
        weekly: selectedPackage.price_per_week,
        monthly: selectedPackage.price_per_month
      })
    : null

  const totalPrice = priceInfo?.price || 0
  const minStay = selectedPackage?.min_stay_days ?? (selectedPackage?.type === 'training' ? 1 : 7)
  const showMinStayWarning = selectedPackage && duration < minStay && isValidDuration
  const meetsMinimumStay = !selectedPackage || duration >= minStay

  return (
    <>
      <Card className="sticky top-4 border-0 shadow-lg bg-white overflow-hidden">
        <CardHeader className="bg-[#febb02] text-[#003580] pt-6 pb-6">
          {!selectedPackage ? (
            <>
               <CardTitle className="text-xl">
                Check Availability
              </CardTitle>
              <CardDescription className="text-[#003580]/80">
                Select dates and a package to see pricing
              </CardDescription>
            </>
          ) : !isValidDuration ? (
             <>
               <CardTitle className="text-xl">
                {selectedPackage.name}
              </CardTitle>
              <CardDescription className="text-[#003580]/80">
                Select dates to see total price
              </CardDescription>
            </>
          ) : (
            <>
              <CardDescription className="text-[#003580]/80 font-medium mb-1 uppercase text-xs tracking-wider">
                Total Estimate {priceInfo ? `(${priceInfo.durationLabel})` : ''}
              </CardDescription>
              <CardTitle className="text-3xl">
                {formatPrice(convertPrice(totalPrice, gym.currency))}
              </CardTitle>
              <CardDescription className="text-[#003580]/80 text-xs mt-1">
                 {selectedPackage.name}
                 {showMinStayWarning && (
                   <span className="block text-orange-600 mt-1 font-medium">
                     ⚠ Minimum stay: {minStay} {minStay === 1 ? 'day' : 'days'}
                   </span>
                 )}
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Date Selection */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase text-gray-500">Dates</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Check-in</Label>
                <Input 
                  type="date" 
                  value={checkin} 
                  onChange={(e) => setCheckin(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Check-out</Label>
                <Input 
                  type="date" 
                  value={checkout} 
                  onChange={(e) => setCheckout(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {!selectedPackage && (
               <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 text-sm rounded-md mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Please select a package below
               </div>
            )}
            
            {showMinStayWarning && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 text-orange-800 text-sm rounded-md mb-2">
                <AlertCircle className="w-4 h-4" />
                This package requires a minimum stay of {minStay} {minStay === 1 ? 'day' : 'days'}
              </div>
            )}
            
            {gym.verification_status === 'draft' && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md mb-2">
                <AlertCircle className="w-4 h-4" />
                This gym is not yet verified and cannot accept bookings
              </div>
            )}
            <Button
              className="w-full h-12 text-lg font-bold bg-[#003580] hover:bg-[#003580]/90 shadow-sm"
              onClick={() => setBookingModalOpen(true)}
              disabled={!selectedPackage || !isValidDuration || !meetsMinimumStay || gym.verification_status === 'draft'}
            >
              Request Booking
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              You won't be charged yet. Availability confirmed by gym.
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
          packageVariantId: (selectedPackage as any)?.variant_id,
          packageName: selectedPackage?.name,
          variantName: (selectedPackage as any)?.variant_name,
          estimatedPrice: totalPrice
        }}
      />
    </>
  )
}
