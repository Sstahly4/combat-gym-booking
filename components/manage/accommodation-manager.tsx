'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AccommodationQuickModal } from '@/components/manage/accommodation-quick-modal'
import { listingSectionClass } from '@/components/manage/gym-edit-section'
import { syncGymAccommodationFlags } from '@/lib/manage/sync-gym-accommodation-flags'
import { managedImageDisplayUrl } from '@/lib/images/gym-image-variants'
import { BedDouble, ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROOM_TYPE_LABELS: Record<string, string> = {
  private: 'Private room',
  shared: 'Shared room',
  dorm: 'Dormitory',
}

interface Accommodation {
  id: string
  gym_id: string
  name: string
  description: string | null
  room_type: 'private' | 'shared' | 'dorm' | null
  capacity: number | null
  price_per_day: number | null
  price_per_week: number | null
  price_per_month: number | null
  currency: string
  images: string[]
  is_active: boolean
}

interface AccommodationManagerProps {
  gymId: string
  currency: string
  /** When true, render without the internal page header (for full-page usage). */
  hideHeader?: boolean
  /** Increment to open the add-room modal from a parent header action. */
  addSignal?: number
}

function normalizeImageRef(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim()
  if (raw && typeof raw === 'object' && 'url' in raw && typeof (raw as { url: unknown }).url === 'string') {
    const obj = raw as { url: string; variants?: unknown }
    if (obj.variants && typeof obj.variants === 'object') {
      return JSON.stringify({ url: obj.url, variants: obj.variants })
    }
    return obj.url.trim()
  }
  return ''
}

function accommodationThumbUrl(images: string[] | null | undefined): string | null {
  const first = images?.[0]
  if (!first) return null
  const ref = normalizeImageRef(first)
  if (!ref) return null
  return managedImageDisplayUrl(ref) ?? (ref.startsWith('http') ? ref : null)
}

function priceSummary(acc: Accommodation): string {
  if (acc.price_per_week != null) {
    return `${acc.currency} ${acc.price_per_week.toLocaleString()}/week`
  }
  if (acc.price_per_day != null) {
    return `${acc.currency} ${acc.price_per_day.toLocaleString()}/day`
  }
  if (acc.price_per_month != null) {
    return `${acc.currency} ${acc.price_per_month.toLocaleString()}/month`
  }
  return 'No price set'
}

const ADD_TILE_CLASS =
  'flex min-h-[17.5rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 text-center transition-colors hover:border-gray-300 hover:bg-gray-50'

export function AccommodationManager({ gymId, currency, addSignal = 0 }: AccommodationManagerProps) {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const fetchAccommodations = useCallback(async () => {
    if (!gymId) return

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('accommodations')
      .select(
        'id, gym_id, name, description, room_type, capacity, price_per_day, price_per_week, price_per_month, currency, images, is_active',
      )
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching accommodations:', error)
    } else {
      setAccommodations((data as Accommodation[]) || [])
    }
    setLoading(false)
  }, [gymId])

  useEffect(() => {
    void fetchAccommodations()
  }, [fetchAccommodations])

  useEffect(() => {
    if (addSignal > 0) {
      setEditId(null)
      setModalOpen(true)
    }
  }, [addSignal])

  const openAdd = () => {
    setEditId(null)
    setModalOpen(true)
  }

  const openEdit = (id: string) => {
    setEditId(id)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this room? It will be unlinked from any packages.')) return

    const supabase = createClient()
    const { error } = await supabase.from('accommodations').delete().eq('id', id)

    if (error) {
      alert(`Failed to delete: ${error.message}`)
      return
    }

    await syncGymAccommodationFlags(supabase, gymId)
    void fetchAccommodations()
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

  if (accommodations.length === 0) {
    return (
      <>
        <button type="button" onClick={openAdd} className={ADD_TILE_CLASS}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <BedDouble className="h-6 w-6 text-gray-700" aria-hidden />
          </span>
          <div>
            <p className="text-base font-semibold text-gray-900">Add your first room</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Create room types guests can book with training packages or Train & Stay offers.
            </p>
          </div>
        </button>

        <AccommodationQuickModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          gymId={gymId}
          currency={currency}
          formOnly
          editAccommodationId={editId}
          onSaved={() => void fetchAccommodations()}
        />
      </>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accommodations.map((acc) => {
          const thumbSrc = accommodationThumbUrl(acc.images)
          const roomLabel = acc.room_type ? ROOM_TYPE_LABELS[acc.room_type] ?? acc.room_type : null

          return (
            <article
              key={acc.id}
              className={cn(
                listingSectionClass,
                'group flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-md',
                !acc.is_active && 'opacity-70',
              )}
            >
              <button
                type="button"
                onClick={() => openEdit(acc.id)}
                className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 text-left"
              >
                {thumbSrc ? (
                  <img src={thumbSrc} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <ImageIcon className="h-10 w-10" aria-hidden />
                  </div>
                )}
                {acc.images.length > 1 ? (
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
                    +{acc.images.length - 1} photos
                  </span>
                ) : null}
                {!acc.is_active ? (
                  <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                    Inactive
                  </span>
                ) : null}
              </button>

              <div className="flex flex-1 flex-col p-4">
                <button type="button" onClick={() => openEdit(acc.id)} className="min-w-0 flex-1 text-left">
                  <h3 className="truncate text-base font-semibold text-gray-900">{acc.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {roomLabel ? (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {roomLabel}
                      </span>
                    ) : null}
                    {acc.capacity ? (
                      <span className="text-xs text-gray-500">
                        Sleeps {acc.capacity}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#003580]">{priceSummary(acc)}</p>
                  {acc.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">{acc.description}</p>
                  ) : null}
                </button>

                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => openEdit(acc.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(acc.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 transition-colors hover:border-red-200 hover:bg-red-50"
                    aria-label={`Delete ${acc.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            </article>
          )
        })}

        <button type="button" onClick={openAdd} className={ADD_TILE_CLASS}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.04]">
            <Plus className="h-5 w-5 text-gray-700" aria-hidden />
          </span>
          <span className="text-sm font-medium text-gray-700">Add accommodation</span>
        </button>
      </div>

      <AccommodationQuickModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        gymId={gymId}
        currency={currency}
        formOnly
        editAccommodationId={editId}
        onSaved={() => void fetchAccommodations()}
      />
    </>
  )
}
