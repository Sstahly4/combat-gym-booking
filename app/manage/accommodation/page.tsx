'use client'

import { useEffect, useState } from 'react'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { AccommodationManager } from '@/components/manage/accommodation-manager'
import { GymEditLayout } from '@/components/manage/gym-edit-layout'
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

  if (gymLoading || loading) {
    return (
      <GymEditLayout
        gymId={activeGymId ?? ''}
        activeSection="basic"
        title="Accommodation"
        sections={{}}
        saving={false}
        hideSaveBar
      >
        <div className="space-y-4">
          <div className="h-4 w-72 animate-pulse rounded bg-gray-100" />
          <div className="h-40 w-full animate-pulse rounded-lg bg-gray-100" />
        </div>
      </GymEditLayout>
    )
  }

  if (error || !activeGymId) {
    return (
      <GymEditLayout
        gymId={activeGymId ?? ''}
        activeSection="basic"
        title="Accommodation"
        sections={{}}
        saving={false}
        hideSaveBar
      >
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error || 'Missing gym context.'}
        </div>
      </GymEditLayout>
    )
  }

  return (
    <GymEditLayout
      gymId={activeGymId}
      activeSection="basic"
      title="Accommodation"
      sections={{}}
      saving={false}
      hideSaveBar
    >
      <p className="text-sm text-gray-500">
        Create room types here, then link them to training + stay or all-inclusive packages.
      </p>
      <AccommodationManager gymId={activeGymId} currency={currency} hideHeader />
    </GymEditLayout>
  )
}
