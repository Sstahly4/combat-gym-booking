'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useBooking } from '@/lib/contexts/booking-context'
import type { Gym } from '@/lib/types/database'
import { Calendar } from 'lucide-react'

export function ReserveButton({ gym }: { gym: Gym }) {
  const router = useRouter()
  const { selectedPackage, checkin, checkout } = useBooking()

  const handleReserve = () => {
    // Block booking for draft gyms
    if (gym.verification_status === 'draft') {
      alert('This gym is not yet verified and cannot accept bookings. Please check back later.')
      return
    }

    if (!selectedPackage) {
      // Scroll to packages section
      document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    // Navigate to booking summary with selected package
    const params = new URLSearchParams({
      gymId: gym.id,
      packageId: selectedPackage.id,
      checkin: checkin || '',
      checkout: checkout || '',
    })
    
    if ((selectedPackage as any)?.variant_id) {
      params.set('variantId', (selectedPackage as any).variant_id)
    }

    router.push(`/bookings/summary?${params.toString()}`)
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
