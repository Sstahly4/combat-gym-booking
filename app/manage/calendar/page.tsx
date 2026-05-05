'use client'

import Link from 'next/link'
import { ManageBreadcrumbs } from '@/components/manage/manage-breadcrumbs'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { CalendarAvailabilityGrid } from '@/components/manage/calendar-availability-grid'
import { Loader2 } from 'lucide-react'

export default function ManageCalendarPage() {
  const { activeGymId, loading, gyms } = useActiveGym()

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-8">
        <ManageBreadcrumbs
          items={[
            { label: 'Dashboard', href: '/manage' },
            { label: 'Calendar & availability' },
          ]}
        />
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Calendar &amp; availability
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Set prices, spots, and closures by date. Bookings update this calendar
              automatically.
            </p>
          </div>
          <Link
            href="/manage/bookings"
            className="text-sm font-medium text-[#003580] underline-offset-2 hover:underline"
          >
            View incoming bookings →
          </Link>
        </div>

        <div className="mt-6 sm:mt-8">
          {loading ? (
            <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-20 text-sm text-gray-500 shadow-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading your gyms…
            </div>
          ) : gyms.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-900">No gym yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Finish your listing to start managing availability.
              </p>
              <Link
                href="/manage/onboarding"
                className="mt-4 inline-flex items-center justify-center rounded-md bg-[#003580] px-4 py-2 text-sm font-medium text-white hover:bg-[#002a66]"
              >
                Continue setup
              </Link>
            </div>
          ) : activeGymId ? (
            <CalendarAvailabilityGrid gymId={activeGymId} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
