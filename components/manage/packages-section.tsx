'use client'

import { useCallback, useEffect, useRef, useState, type ElementType } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Package } from '@/lib/types/database'
import { listingSectionClass } from '@/components/manage/gym-edit-section'
import { managedImageDisplayUrl } from '@/lib/images/gym-image-variants'
import {
  offerTypeUsesTrainingAccess,
  trainingAccessCardLabel,
} from '@/lib/packages/training-access'
import {
  Plus,
  Pencil,
  Trash2,
  Ticket,
  Calendar,
  BedDouble,
  UtensilsCrossed,
  Dumbbell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PackagesSectionProps {
  gymId: string
  currency: string
  isAdmin?: boolean
  listRefreshKey?: number
  onEditPackage: (pkg: Package) => void
  onCreatePackage: () => void
  /** Increment to open create flow from a parent header action. */
  addSignal?: number
}

const OFFER_TYPE_META: Record<string, { label: string; badgeClass: string; icon: ElementType }> = {
  TYPE_TRAINING_ONLY: { label: 'Training only', badgeClass: 'bg-blue-50 text-blue-700', icon: Dumbbell },
  TYPE_TRAINING_ACCOM: { label: 'Train & Stay', badgeClass: 'bg-emerald-50 text-emerald-700', icon: BedDouble },
  TYPE_ALL_INCLUSIVE: { label: 'All-inclusive', badgeClass: 'bg-purple-50 text-purple-700', icon: UtensilsCrossed },
  TYPE_CUSTOM_EXP: { label: 'Short-term experience', badgeClass: 'bg-orange-50 text-orange-700', icon: Calendar },
  TYPE_ONE_TIME_EVENT: { label: 'One-time event', badgeClass: 'bg-amber-50 text-amber-700', icon: Ticket },
}

const ADD_TILE_CLASS =
  'flex min-h-[17.5rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 text-center transition-colors hover:border-gray-300 hover:bg-gray-50'

function packagePriceSummary(pkg: Package): string | null {
  if (pkg.offer_type === 'TYPE_ONE_TIME_EVENT') {
    if (pkg.variants && pkg.variants.length > 0) {
      return `${pkg.variants.length} ticket tier${pkg.variants.length !== 1 ? 's' : ''}`
    }
    if (pkg.price_per_day != null) {
      return `${pkg.currency} ${pkg.price_per_day.toLocaleString()}/ticket`
    }
    return null
  }
  if (pkg.price_per_week != null) {
    return `${pkg.currency} ${pkg.price_per_week.toLocaleString()}/week`
  }
  if (pkg.price_per_day != null) {
    return `${pkg.currency} ${pkg.price_per_day.toLocaleString()}/day`
  }
  if (pkg.variants && pkg.variants.length > 0) {
    return `${pkg.variants.length} room option${pkg.variants.length !== 1 ? 's' : ''}`
  }
  return null
}

export function PackagesSection({
  gymId,
  listRefreshKey = 0,
  onEditPackage,
  onCreatePackage,
  addSignal = 0,
}: PackagesSectionProps) {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const onCreateRef = useRef(onCreatePackage)
  onCreateRef.current = onCreatePackage

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('packages')
      .select('*, variants:package_variants(*)')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false })

    if (data) setPackages(data)
    setLoading(false)
  }, [gymId])

  useEffect(() => {
    void fetchPackages()
  }, [fetchPackages, listRefreshKey])

  useEffect(() => {
    if (addSignal > 0) onCreateRef.current()
  }, [addSignal])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('packages').delete().eq('id', id)
    if (error) {
      alert(`Failed to delete: ${error.message}`)
      return
    }
    await fetchPackages()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    )
  }

  if (packages.length === 0) {
    return (
      <button type="button" onClick={onCreatePackage} className={ADD_TILE_CLASS}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
          <Ticket className="h-6 w-6 text-gray-700" aria-hidden />
        </span>
        <div>
          <p className="text-base font-semibold text-gray-900">Create your first offer</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Training-only, Train & Stay, all-inclusive, and event packages guests can book on your listing.
          </p>
        </div>
      </button>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {packages.map((pkg) => {
        const meta = OFFER_TYPE_META[pkg.offer_type] || OFFER_TYPE_META.TYPE_TRAINING_ONLY
        const Icon = meta.icon
        const imageSrc = pkg.image ? managedImageDisplayUrl(pkg.image) : null
        const priceLabel = packagePriceSummary(pkg)
        const trainingAccessLabel = offerTypeUsesTrainingAccess(pkg.offer_type)
          ? trainingAccessCardLabel(pkg.training_access ?? 'twice_daily')
          : null

        return (
          <article
            key={pkg.id}
            className={cn(
              listingSectionClass,
              'group flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-md',
            )}
          >
            <button
              type="button"
              onClick={() => onEditPackage(pkg)}
              className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 text-left"
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-300">
                  <Icon className="h-10 w-10" aria-hidden />
                </div>
              )}
              <span
                className={cn(
                  'absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium',
                  meta.badgeClass,
                )}
              >
                {meta.label}
              </span>
            </button>

            <div className="flex flex-1 flex-col p-4">
              <button type="button" onClick={() => onEditPackage(pkg)} className="min-w-0 flex-1 text-left">
                <h3 className="truncate text-base font-semibold text-gray-900">{pkg.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span>{pkg.sport}</span>
                  {trainingAccessLabel ? (
                    <span className="inline-flex items-center gap-1">
                      <Dumbbell className="h-3.5 w-3.5" aria-hidden />
                      {trainingAccessLabel}
                    </span>
                  ) : null}
                </div>
                {priceLabel ? (
                  <p className="mt-2 text-sm font-medium text-[#003580]">{priceLabel}</p>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">No price set</p>
                )}
                {pkg.offer_type === 'TYPE_ONE_TIME_EVENT' && pkg.event_date ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-amber-700">
                    <Calendar className="h-3.5 w-3.5" aria-hidden />
                    {new Date(pkg.event_date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                ) : null}
              </button>

              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => onEditPackage(pkg)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(pkg.id, pkg.name)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 transition-colors hover:border-red-200 hover:bg-red-50"
                  aria-label={`Delete ${pkg.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </article>
        )
      })}

      <button type="button" onClick={onCreatePackage} className={ADD_TILE_CLASS}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.04]">
          <Plus className="h-5 w-5 text-gray-700" aria-hidden />
        </span>
        <span className="text-sm font-medium text-gray-700">Create offer</span>
      </button>
    </div>
  )
}
