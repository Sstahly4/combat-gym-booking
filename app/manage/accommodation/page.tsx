'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { AccommodationManager } from '@/components/manage/accommodation-manager'
import { GymEditLayout } from '@/components/manage/gym-edit-layout'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type GymCurrencyRow = { currency: string | null }

export default function ManageAccommodationPage() {
  const { activeGymId, loading: gymLoading } = useActiveGym()
  const [currency, setCurrency] = useState<string>('USD')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addSignal, setAddSignal] = useState(0)

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

  const layoutProps = {
    gymId: activeGymId ?? '',
    activeSection: 'accommodation',
    title: 'Accommodation',
    subtitle:
      'Create room types guests can book with training packages. Link them to Train & Stay or all-inclusive offers.',
    sections: {},
    saving: false,
    hideSaveBar: true as const,
    contentWidth: 'full' as const,
  }

  if (gymLoading || loading) {
    return (
      <GymEditLayout {...layoutProps}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </GymEditLayout>
    )
  }

  if (error || !activeGymId) {
    return (
      <GymEditLayout {...layoutProps}>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error || 'Missing gym context.'}
        </div>
      </GymEditLayout>
    )
  }

  return (
    <GymEditLayout
      {...layoutProps}
      headerActions={
        <button
          type="button"
          onClick={() => setAddSignal((n) => n + 1)}
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition-colors hover:bg-gray-50',
          )}
          aria-label="Add accommodation"
        >
          <Plus className="h-5 w-5" aria-hidden />
        </button>
      }
    >
      <AccommodationManager gymId={activeGymId} currency={currency} hideHeader addSignal={addSignal} />
    </GymEditLayout>
  )
}
