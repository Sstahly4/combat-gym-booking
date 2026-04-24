'use client'

import { useEffect, useMemo, useState } from 'react'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { ManageBreadcrumbs } from '@/components/manage/manage-breadcrumbs'
import { AccommodationManager } from '@/components/manage/accommodation-manager'
import { createClient } from '@/lib/supabase/client'

type GymCurrencyRow = { currency: string | null }

export default function ManageAccommodationPage() {
  const { activeGymId, loading: gymLoading } = useActiveGym()
  const [currency, setCurrency] = useState<string>('USD')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (gymLoading) return
    if (!activeGymId) {
      setLoading(false)
      setError('No active gym selected.')
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('gyms')
        .select('currency')
        .eq('id', activeGymId)
        .single<GymCurrencyRow>()

      if (cancelled) return
      if (fetchError) {
        setError(fetchError.message)
        setCurrency('USD')
      } else {
        setCurrency(data?.currency || 'USD')
      }
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [activeGymId, gymLoading])

  const crumbs = useMemo(
    () => [
      { label: 'Home', href: '/manage' },
      { label: 'Accommodation' },
    ],
    []
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <ManageBreadcrumbs items={crumbs} />
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Accommodation
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create room types separately, then link them to packages.
            </p>
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          {gymLoading || loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
              <div className="mt-3 h-3 w-72 animate-pulse rounded bg-gray-100" />
              <div className="mt-6 h-40 w-full animate-pulse rounded bg-gray-50" />
            </div>
          ) : error || !activeGymId ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error || 'Missing gym context.'}
            </div>
          ) : (
            <AccommodationManager gymId={activeGymId} currency={currency} hideHeader />
          )}
        </div>
      </div>
    </div>
  )
}

