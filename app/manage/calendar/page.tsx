'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { CalendarAvailabilityGrid } from '@/components/manage/calendar-availability-grid'
import { Loader2 } from 'lucide-react'

export default function ManageCalendarPage() {
  const { activeGymId, loading, gyms } = useActiveGym()
  const searchParams = useSearchParams()
  const router = useRouter()
  const packageVariantId = searchParams.get('package_variant_id')

  const setVariantFilter = (variantId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (variantId) params.set('package_variant_id', variantId)
    else params.delete('package_variant_id')
    if (activeGymId) params.set('gym_id', activeGymId)
    const qs = params.toString()
    router.replace(qs ? `/manage/calendar?${qs}` : '/manage/calendar')
  }

  return (
    <div className="min-h-0 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Calendar
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Set prices, spots, and closures by date. Guest bookings appear on the grid
            automatically.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-24 text-sm text-gray-500 shadow-sm">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading your gyms…
          </div>
        ) : gyms.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-900">No gym yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Finish your listing to start managing availability.
            </p>
          </div>
        ) : activeGymId ? (
          <CalendarAvailabilityGrid
            gymId={activeGymId}
            packageVariantId={packageVariantId}
            onVariantFilterChange={setVariantFilter}
          />
        ) : null}
      </div>
    </div>
  )
}
