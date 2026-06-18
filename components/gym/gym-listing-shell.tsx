'use client'

import { MapPin } from 'lucide-react'
import { GymPageMinHeightShell } from '@/components/gym/gym-page-shell'
import type { BookingPrefillData } from '@/lib/utils/booking-prefill'
import { primaryGymImageCardSrc } from '@/lib/images/gym-image-variants'

/** Instant gym listing paint while the server page loads after checkout exit. */
export function GymListingShell({ prefill }: { prefill: BookingPrefillData }) {
  const gym = prefill.gym as {
    name?: string
    city?: string
    country?: string
    images?: { url: string; variants?: { w400?: string; w800?: string; w1200?: string } | null }[]
  }
  const mainImage =
    gym.images && gym.images.length > 0 ? primaryGymImageCardSrc(gym.images[0]) : null

  return (
    <GymPageMinHeightShell className="pb-12">
      <div className="bg-white border-b border-gray-200 py-4 md:py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
            <span className="whitespace-nowrap">Home</span>
            <span className="mx-1.5 md:mx-2">/</span>
            <span className="whitespace-nowrap">{gym.country}</span>
            <span className="mx-1.5 md:mx-2">/</span>
            <span className="whitespace-nowrap">{gym.city}</span>
            <span className="mx-1.5 md:mx-2">/</span>
            <span className="text-gray-900 font-medium truncate">{gym.name}</span>
          </div>
          <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-2">
            {gym.name}
          </h1>
          <div className="flex items-center gap-1.5 text-gray-600">
            <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
            <span className="text-sm md:text-[15px]">
              {gym.city}, {gym.country}
            </span>
          </div>
        </div>
      </div>
      {mainImage ? (
        <div className="md:hidden w-full aspect-[4/3] bg-gray-100">
          <img src={mainImage} alt={gym.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="md:hidden w-full aspect-[4/3] bg-gray-100" />
      )}
      <div className="hidden md:block max-w-6xl mx-auto px-4 pt-6">
        <div className="aspect-[16/7] rounded-xl bg-gray-100 overflow-hidden">
          {mainImage ? (
            <img src={mainImage} alt={gym.name} className="w-full h-full object-cover" />
          ) : null}
        </div>
      </div>
    </GymPageMinHeightShell>
  )
}
