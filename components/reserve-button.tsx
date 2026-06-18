'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useBooking } from '@/lib/contexts/booking-context'
import { useReviewModal } from '@/lib/contexts/review-modal-context'
import type { Gym } from '@/lib/types/database'
import type { GymListing } from '@/lib/gym/gym-listing-data'
import { Calendar } from 'lucide-react'

export function ReserveButton({ gym }: { gym: Gym | GymListing }) {
  const router = useRouter()
  const { selectedPackage, checkin, checkout } = useBooking()
  const { openReviewModal } = useReviewModal()

  const handleReserve = () => {
    // Block booking for draft gyms
    if (gym.verification_status === 'draft') {
      alert('This gym is not yet verified and cannot accept bookings. Please check back later.')
      return
    }

    if (!selectedPackage) {
      document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    if (isMobile) {
      // Mobile: open full-screen overlay modal — pass pre-loaded data so it renders instantly
      const listing = gym as GymListing
      const reviewCount =
        typeof listing.reviewCount === 'number'
          ? listing.reviewCount
          : ((gym as Gym & { reviews?: { rating: number }[] }).reviews?.length ?? 0)
      const reviewAverage =
        typeof listing.averageRating === 'number' && listing.reviewCount > 0
          ? listing.averageRating
          : (() => {
              const reviews = (gym as Gym & { reviews?: { rating: number }[] }).reviews ?? []
              return reviews.length > 0
                ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                : 0
            })()
      openReviewModal({
        gymId: gym.id,
        packageId: selectedPackage.id,
        variantId: (selectedPackage as { variant_id?: string })?.variant_id,
        checkin: checkin || '',
        checkout: checkout || '',
        gymData: gym as unknown as Record<string, unknown>,
        packageData: selectedPackage as unknown as Record<string, unknown>,
        initialReviewCount: reviewCount,
        initialReviewAverage: reviewAverage,
      })
    } else {
      // Desktop: navigate straight to summary
      const params = new URLSearchParams({
        gymId: gym.id,
        packageId: selectedPackage.id,
        checkin: checkin || '',
        checkout: checkout || '',
      })
      if ((selectedPackage as any)?.variant_id) params.set('variantId', (selectedPackage as any).variant_id)
      router.push(`/bookings/summary?${params.toString()}`)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Button
      onClick={handleReserve}
      className="h-9 md:h-10 px-4 md:px-6 text-xs md:text-base font-bold bg-[#003580] hover:bg-[#003580]/90 shadow-md w-auto"
    >
      Reserve
    </Button>
  )
}
