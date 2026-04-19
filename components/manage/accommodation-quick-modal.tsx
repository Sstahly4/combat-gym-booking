'use client'

import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  BedDouble,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

const ROOM_TYPES = [
  { value: '', label: 'Any / not specified' },
  { value: 'private', label: 'Private room' },
  { value: 'shared', label: 'Shared room' },
  { value: 'dorm', label: 'Dormitory' },
]

const CURRENCIES = [
  'USD', 'THB', 'EUR', 'GBP', 'AUD', 'IDR', 'JPY', 'CNY', 'SGD', 'MYR', 'NZD', 'CAD', 'HKD', 'INR', 'KRW', 'PHP', 'VND',
]

/** Boolean amenity keys stored in JSONB (bathroom handled separately). */
const AMENITY_BOOL_KEYS = [
  'ac',
  'fan',
  'wifi',
  'hot_water',
  'balcony',
  'window',
  'tv',
  'safe',
  'mini_fridge',
  'kettle',
  'microwave',
  'desk',
  'wardrobe',
  'bed_linens',
  'towels',
  'hair_dryer',
  'iron',
  'housekeeping',
  'blackout_curtains',
  'mosquito_net',
  'sea_view',
  'quiet_street',
  'laundry_in_room',
] as const

type AmenityBoolKey = (typeof AMENITY_BOOL_KEYS)[number]

type RoomAmenities = Record<AmenityBoolKey, boolean> & {
  bathroom: 'private' | 'shared' | 'none'
}

const AMENITY_LABELS: Record<AmenityBoolKey, string> = {
  ac: 'Air conditioning',
  fan: 'Fan',
  wifi: 'WiFi',
  hot_water: 'Hot water',
  balcony: 'Balcony / terrace',
  window: 'Window (natural light)',
  tv: 'TV',
  safe: 'In-room safe',
  mini_fridge: 'Mini fridge',
  kettle: 'Kettle / hot water jug',
  microwave: 'Microwave',
  desk: 'Desk / workspace',
  wardrobe: 'Wardrobe / closet',
  bed_linens: 'Bed linens included',
  towels: 'Towels included',
  hair_dryer: 'Hair dryer',
  iron: 'Iron',
  housekeeping: 'Daily housekeeping',
  blackout_curtains: 'Blackout curtains',
  mosquito_net: 'Mosquito net',
  sea_view: 'Sea / mountain view',
  quiet_street: 'Quiet side / away from road',
  laundry_in_room: 'In-room laundry (washer / line)',
}

function defaultAmenities(): RoomAmenities {
  const bools = Object.fromEntries(AMENITY_BOOL_KEYS.map((k) => [k, false])) as Record<AmenityBoolKey, boolean>
  return { ...bools, bathroom: 'shared' }
}

function normalizeAmenities(raw: Record<string, unknown> | undefined): RoomAmenities {
  const base = defaultAmenities()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base
  const b = raw.bathroom
  const bathroom: RoomAmenities['bathroom'] =
    b === 'private' || b === 'shared' || b === 'none' ? b : 'shared'
  const next: RoomAmenities = { ...base, bathroom }
  for (const key of AMENITY_BOOL_KEYS) {
    next[key] = Boolean(raw[key])
  }
  return next
}

function buildAmenitiesPayload(state: RoomAmenities, baseline: Record<string, unknown>): Record<string, unknown> {
  const out = { ...baseline }
  for (const key of AMENITY_BOOL_KEYS) {
    out[key] = state[key]
  }
  out.bathroom = state.bathroom
  return out
}

type AccommodationRow = {
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
  is_active: boolean
  images?: string[]
  amenities?: Record<string, unknown>
}

export type AccommodationQuickModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  gymId: string
  currency: string
  /** Fired after create, update, or delete */
  onSaved?: () => void
}

const fieldClass =
  'border-gray-200 bg-white focus-visible:border-[#003580]/45 focus-visible:ring-[#003580]/20'
const checkClass =
  'h-4 w-4 shrink-0 rounded border-gray-300 text-[#003580] focus:ring-[#003580]/30 focus:ring-offset-0'

const MAX_IMAGES = 10
/** Checkbox rows visible before "Show more" (~2 rows in a 3-col grid). */
const AMENITIES_PREVIEW_COUNT = 6

type PhotoItem =
  | { id: string; kind: 'saved'; url: string }
  | { id: string; kind: 'pending'; file: File; previewUrl: string }

function newPhotoId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function fileNameFromSavedUrl(url: string): string {
  try {
    const last = new URL(url).pathname.split('/').filter(Boolean).pop()
    return last ? decodeURIComponent(last) : 'Photo'
  } catch {
    return 'Photo'
  }
}

function revokePendingPreviews(items: PhotoItem[]) {
  for (const p of items) {
    if (p.kind === 'pending') URL.revokeObjectURL(p.previewUrl)
  }
}

const sectionCard = 'rounded-xl border border-gray-200/90 bg-gray-50/50 p-5 shadow-sm md:p-6'
const sectionTitle = 'text-base font-semibold tracking-tight text-gray-900'
const sectionHint = 'mt-1 text-sm leading-relaxed text-muted-foreground'
const btnPrimary = 'bg-[#003580] text-white hover:bg-[#003580]/90'
const btnGhost = 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'

export function AccommodationQuickModal({
  open,
  onOpenChange,
  gymId,
  currency,
  onSaved,
}: AccommodationQuickModalProps) {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<AccommodationRow[]>([])
  const [mode, setMode] = useState<'list' | 'form'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [roomType, setRoomType] = useState('')
  const [capacity, setCapacity] = useState('')
  const [priceDay, setPriceDay] = useState('')
  const [priceWeek, setPriceWeek] = useState('')
  const [priceMonth, setPriceMonth] = useState('')
  const [accCurrency, setAccCurrency] = useState(currency)
  const [isActive, setIsActive] = useState(true)
  const [amenities, setAmenities] = useState<RoomAmenities>(() => defaultAmenities())
  const [amenitiesBaseline, setAmenitiesBaseline] = useState<Record<string, unknown>>({})
  const [amenitiesGridExpanded, setAmenitiesGridExpanded] = useState(false)
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([])
  const [photoLightbox, setPhotoLightbox] = useState<{ src: string; fileName: string } | null>(null)
  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const photoInputId = useId().replace(/:/g, '')

  const selectedAmenityCount = useMemo(() => {
    return AMENITY_BOOL_KEYS.filter((k) => amenities[k]).length
  }, [amenities])

  const fetchRows = useCallback(async () => {
    if (!gymId) return
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('accommodations')
      .select(
        'id, gym_id, name, description, room_type, capacity, price_per_day, price_per_week, price_per_month, currency, is_active, images, amenities'
      )
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false })
    if (!error && data) setRows(data as AccommodationRow[])
    setLoading(false)
  }, [gymId])

  useEffect(() => {
    if (!open) {
      setMode('list')
      setEditingId(null)
      setAmenitiesGridExpanded(false)
      setPhotoLightbox(null)
      setPhotoItems((prev) => {
        revokePendingPreviews(prev)
        return []
      })
      return
    }
    void fetchRows()
  }, [open, fetchRows])

  useEffect(() => {
    if (open) setAccCurrency(currency)
  }, [open, currency])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setRoomType('')
    setCapacity('')
    setPriceDay('')
    setPriceWeek('')
    setPriceMonth('')
    setAccCurrency(currency)
    setIsActive(true)
    setAmenities(defaultAmenities())
    setAmenitiesBaseline({})
    setAmenitiesGridExpanded(false)
    setPhotoLightbox(null)
    setPhotoItems((prev) => {
      revokePendingPreviews(prev)
      return []
    })
  }

  const openNew = () => {
    resetForm()
    setMode('form')
  }

  const openEdit = (row: AccommodationRow) => {
    setEditingId(row.id)
    setName(row.name)
    setDescription(row.description || '')
    setRoomType(row.room_type || '')
    setCapacity(row.capacity != null ? String(row.capacity) : '')
    setPriceDay(row.price_per_day != null ? String(row.price_per_day) : '')
    setPriceWeek(row.price_per_week != null ? String(row.price_per_week) : '')
    setPriceMonth(row.price_per_month != null ? String(row.price_per_month) : '')
    setAccCurrency(row.currency || currency)
    setIsActive(row.is_active !== false)
    const raw =
      row.amenities && typeof row.amenities === 'object' && !Array.isArray(row.amenities)
        ? { ...(row.amenities as Record<string, unknown>) }
        : {}
    setAmenitiesBaseline(raw)
    const norm = normalizeAmenities(raw)
    setAmenities(norm)
    setAmenitiesGridExpanded(false)
    setPhotoLightbox(null)
    setPhotoItems((prev) => {
      revokePendingPreviews(prev)
      const urls = Array.isArray(row.images) ? row.images : []
      return urls.map((url) => ({ id: newPhotoId(), kind: 'saved' as const, url }))
    })
    setMode('form')
  }

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const picked = Array.from(e.target.files)
    setPhotoItems((prev) => {
      const room = Math.max(0, MAX_IMAGES - prev.length)
      if (room <= 0) {
        alert(`You can have at most ${MAX_IMAGES} images per room.`)
        return prev
      }
      const slice = picked.slice(0, room)
      if (picked.length > slice.length) {
        alert(`Only ${slice.length} more image(s) added (max ${MAX_IMAGES} total).`)
      }
      const additions: PhotoItem[] = slice.map((file) => ({
        id: newPhotoId(),
        kind: 'pending',
        file,
        previewUrl: URL.createObjectURL(file),
      }))
      return [...prev, ...additions]
    })
    e.target.value = ''
  }

  const removePhotoItem = (id: string) => {
    setPhotoItems((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item?.kind === 'pending') URL.revokeObjectURL(item.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  const reorderPhotoDrop = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return
    setPhotoItems((prev) => {
      const from = prev.findIndex((p) => p.id === draggedId)
      const to = prev.findIndex((p) => p.id === targetId)
      if (from === -1 || to === -1) return prev
      const next = [...prev]
      const [removed] = next.splice(from, 1)
      next.splice(to, 0, removed)
      return next
    })
  }

  const movePhoto = (index: number, delta: number) => {
    setPhotoItems((prev) => {
      const newIndex = index + delta
      if (newIndex < 0 || newIndex >= prev.length) return prev
      const next = [...prev]
      const [r] = next.splice(index, 1)
      next.splice(newIndex, 0, r)
      return next
    })
  }

  useEffect(() => {
    if (!photoLightbox) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setPhotoLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [photoLightbox])

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Enter a room name')
      return
    }
    if (!priceDay && !priceWeek && !priceMonth) {
      alert('Enter at least one price (per day, week, or month)')
      return
    }
    setSaving(true)
    const supabase = createClient()

    const pendingFiles = photoItems.filter((p): p is Extract<PhotoItem, { kind: 'pending' }> => p.kind === 'pending')
    const uploadedByOrder: string[] = []
    for (let i = 0; i < pendingFiles.length; i++) {
      const image = pendingFiles[i].file
      try {
        const fileExt = image.name.split('.').pop() || 'jpg'
        const fileName = `accommodations/${gymId}/${Date.now()}-${i}-${newPhotoId().slice(0, 8)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('gym-images').upload(fileName, image)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('gym-images').getPublicUrl(fileName)
        uploadedByOrder.push(data.publicUrl)
      } catch (err) {
        console.error(err)
        alert('One or more images failed to upload. Try smaller files or check your connection.')
        setSaving(false)
        return
      }
    }

    let uploadIdx = 0
    const allImages: string[] = []
    for (const item of photoItems) {
      if (item.kind === 'saved') allImages.push(item.url)
      else {
        allImages.push(uploadedByOrder[uploadIdx]!)
        uploadIdx += 1
      }
    }
    const amenitiesPayload = buildAmenitiesPayload(amenities, amenitiesBaseline)

    const basePayload = {
      name: name.trim(),
      description: description.trim() || null,
      room_type: (roomType || null) as 'private' | 'shared' | 'dorm' | null,
      capacity: capacity ? parseInt(capacity, 10) : null,
      price_per_day: priceDay ? parseFloat(priceDay) : null,
      price_per_week: priceWeek ? parseFloat(priceWeek) : null,
      price_per_month: priceMonth ? parseFloat(priceMonth) : null,
      currency: accCurrency,
      images: allImages,
      amenities: amenitiesPayload,
      is_active: isActive,
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('accommodations').update(basePayload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('accommodations').insert({
          ...basePayload,
          gym_id: gymId,
        })
        if (error) throw error
      }
      await fetchRows()
      onSaved?.()
      setMode('list')
      resetForm()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this room? It will be unlinked from any offers.')) return
    const supabase = createClient()
    const { error } = await supabase.from('accommodations').delete().eq('id', id)
    if (error) {
      alert(error.message)
      return
    }
    await fetchRows()
    onSaved?.()
  }

  const priceSummary = (r: AccommodationRow) => {
    if (r.price_per_week != null) return `${r.currency} ${r.price_per_week}/wk`
    if (r.price_per_day != null) return `${r.currency} ${r.price_per_day}/day`
    if (r.price_per_month != null) return `${r.currency} ${r.price_per_month}/mo`
    return '—'
  }

  const dialogWidthClass =
    'w-[calc(100vw-1.5rem)] max-w-7xl sm:w-[calc(100vw-2rem)] md:w-[calc(100vw-3rem)]'

  const bodyScrollClass =
    mode === 'form'
      ? 'max-h-[min(calc(100dvh-8rem),880px)] overflow-y-auto overscroll-contain px-5 py-6 md:px-8 md:py-8 lg:px-10'
      : 'space-y-6 px-5 py-6 md:px-8 md:py-8 lg:px-10'

  const openPhotoPreview = (item: PhotoItem) => {
    if (item.kind === 'saved') {
      setPhotoLightbox({ src: item.url, fileName: fileNameFromSavedUrl(item.url) })
    } else {
      setPhotoLightbox({ src: item.previewUrl, fileName: item.file.name })
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange} stackClassName="z-[120]">
      <DialogContent
        className={cn(
          'flex max-h-[min(96dvh,920px)] flex-col overflow-hidden rounded-xl border border-gray-200/90 bg-white p-0 shadow-md',
          dialogWidthClass
        )}
      >
        <div className="shrink-0 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/40 px-5 py-5 md:px-8 md:py-6 lg:px-10">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight text-[#003580] md:text-xl">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#003580]/10 text-[#003580]">
                <BedDouble className="h-5 w-5" aria-hidden />
              </span>
              <span>
                {mode === 'list' ? 'Accommodation' : editingId ? 'Edit room' : 'Add room'}
              </span>
            </DialogTitle>
            <DialogDescription className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {mode === 'list'
                ? 'Rooms guests can pick for training + accommodation or all-inclusive offers.'
                : 'Describe the room, set rates, photos, and what’s included. At least one price is required.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className={bodyScrollClass}>
          {mode === 'list' ? (
            <>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 py-14 text-center">
                  <BedDouble className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden />
                  <p className="text-sm font-medium text-gray-800">No rooms yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    Add a room to link it to training + accommodation or all-inclusive offers.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {rows.map((r) => {
                    const thumb = r.images?.[0]
                    return (
                      <li
                        key={r.id}
                        className="flex flex-col gap-3 rounded-xl border border-gray-200/90 bg-gray-50/60 p-4 transition-colors hover:border-gray-300 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <div className="flex h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200/90 bg-white shadow-sm">
                            {thumb ? (
                              <img src={thumb} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-300">
                                <ImageIcon className="h-7 w-7" aria-hidden />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">{r.name}</p>
                              {!r.is_active ? (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                                  Inactive
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">{priceSummary(r)}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(btnGhost, 'h-9 px-3')}
                            onClick={() => openEdit(r)}
                          >
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 border-gray-200 px-3 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => void handleDelete(r.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className={btnGhost} onClick={() => onOpenChange(false)}>
                  Done
                </Button>
                <Button type="button" className={cn(btnPrimary, 'shadow-sm')} onClick={openNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add room
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                onClick={() => {
                  setMode('list')
                  resetForm()
                }}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Back to list
              </button>

              <div className={sectionCard}>
                <h3 className={sectionTitle}>Room details</h3>
                <p className={sectionHint}>Name and type shown to guests when they pick a room.</p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900">Room name *</Label>
                    <Input
                      className={fieldClass}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Standard fan room, Private AC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900">Room type</Label>
                    <Select className={fieldClass} value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                      {ROOM_TYPES.map((o) => (
                        <option key={o.value || 'any'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Description</Label>
                  <Textarea
                    className={fieldClass}
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What guests get: bed setup, shared spaces, noise level, ideal for solo travellers or couples, etc."
                  />
                </div>
              </div>

              <div className={sectionCard}>
                <h3 className={sectionTitle}>Capacity, currency &amp; status</h3>
                <p className={sectionHint}>Capacity helps guests understand shared vs private stays.</p>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900">Capacity (people)</Label>
                    <Input
                      className={fieldClass}
                      type="number"
                      min={1}
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="e.g. 1 or 2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900">Currency</Label>
                    <Select className={fieldClass} value={accCurrency} onChange={(e) => setAccCurrency(e.target.value)}>
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900">Status</Label>
                    <Select
                      className={fieldClass}
                      value={isActive ? 'active' : 'inactive'}
                      onChange={(e) => setIsActive(e.target.value === 'active')}
                    >
                      <option value="active">Active — guests can book</option>
                      <option value="inactive">Inactive — hidden from new bookings</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className={sectionCard}>
                <h3 className={sectionTitle}>Pricing *</h3>
                <p className={sectionHint}>
                  Enter at least one rate. Package rules (e.g. weekly rounding) apply at checkout.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">Per day</Label>
                    <Input
                      className={fieldClass}
                      type="number"
                      step="0.01"
                      value={priceDay}
                      onChange={(e) => setPriceDay(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">Per week</Label>
                    <Input
                      className={fieldClass}
                      type="number"
                      step="0.01"
                      value={priceWeek}
                      onChange={(e) => setPriceWeek(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">Per month</Label>
                    <Input
                      className={fieldClass}
                      type="number"
                      step="0.01"
                      value={priceMonth}
                      onChange={(e) => setPriceMonth(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/30 px-5 py-4 md:px-6">
                  <h3 id="acc-amenities-heading" className={sectionTitle}>
                    In-room amenities
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedAmenityCount > 0
                      ? `${selectedAmenityCount} selected · bathroom type below`
                      : 'Optional — helps guests compare rooms. Use Show more for the full checklist.'}
                  </p>
                </div>
                <div
                  className="px-5 pb-5 pt-4 md:px-6 md:pb-6"
                  role="region"
                  aria-labelledby="acc-amenities-heading"
                >
                  {(() => {
                    const hasMoreAmenities = AMENITY_BOOL_KEYS.length > AMENITIES_PREVIEW_COUNT
                    const visibleKeys =
                      amenitiesGridExpanded || !hasMoreAmenities
                        ? AMENITY_BOOL_KEYS
                        : AMENITY_BOOL_KEYS.slice(0, AMENITIES_PREVIEW_COUNT)
                    const hiddenCount = AMENITY_BOOL_KEYS.length - AMENITIES_PREVIEW_COUNT
                    return (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {visibleKeys.map((key) => (
                            <label
                              key={key}
                              className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-2 hover:border-gray-200 hover:bg-gray-50/80"
                            >
                              <input
                                type="checkbox"
                                className={checkClass}
                                checked={amenities[key]}
                                onChange={(e) => setAmenities({ ...amenities, [key]: e.target.checked })}
                              />
                              <span className="text-sm text-gray-800">{AMENITY_LABELS[key]}</span>
                            </label>
                          ))}
                        </div>
                        {hasMoreAmenities ? (
                          <button
                            type="button"
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200/90 bg-gray-50/60 py-2.5 text-sm font-medium text-[#003580] transition-colors hover:bg-gray-100/80"
                            onClick={() => setAmenitiesGridExpanded((e) => !e)}
                            aria-expanded={amenitiesGridExpanded}
                          >
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 shrink-0 transition-transform duration-200',
                                amenitiesGridExpanded && 'rotate-180'
                              )}
                              aria-hidden
                            />
                            {amenitiesGridExpanded
                              ? 'Show fewer amenities'
                              : `Show more amenities (${hiddenCount} more)`}
                          </button>
                        ) : null}
                      </>
                    )
                  })()}
                  <div className="mt-6 max-w-md space-y-2 border-t border-gray-100 pt-5">
                    <Label className="text-sm font-medium text-gray-900">Bathroom</Label>
                    <Select
                      className={fieldClass}
                      value={amenities.bathroom}
                      onChange={(e) =>
                        setAmenities({
                          ...amenities,
                          bathroom: e.target.value as RoomAmenities['bathroom'],
                        })
                      }
                    >
                      <option value="private">Private bathroom</option>
                      <option value="shared">Shared bathroom</option>
                      <option value="none">No bathroom in unit</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className={sectionCard}>
                <h3 className={sectionTitle}>Photos</h3>
                <p className={sectionHint}>
                  Up to {MAX_IMAGES} images — the first slot is the main listing thumbnail. As soon as you choose files
                  from your device, small previews appear below (nothing extra to click). Reorder with drag or arrows;
                  tap a tile for a large preview. Saving the room uploads them to your listing.
                </p>
                <p className="mt-2 text-sm font-medium text-gray-800">
                  {photoItems.length} / {MAX_IMAGES}
                </p>

                <div className="mt-4 min-h-[5.5rem] rounded-xl border border-gray-200/90 bg-white/80 p-3 sm:p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Previews {photoItems.length > 0 ? '· drag to reorder' : ''}
                  </p>
                  {photoItems.length > 0 ? (
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      {photoItems.map((item, index) => {
                        const src = item.kind === 'saved' ? item.url : item.previewUrl
                        const pending = item.kind === 'pending'
                        return (
                          <div key={item.id} className="flex shrink-0 flex-col items-center gap-1.5">
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', item.id)
                                e.dataTransfer.effectAllowed = 'move'
                                setDraggingPhotoId(item.id)
                              }}
                              onDragEnd={() => setDraggingPhotoId(null)}
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.dataTransfer.dropEffect = 'move'
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                const fromId = e.dataTransfer.getData('text/plain')
                                if (fromId) reorderPhotoDrop(fromId, item.id)
                              }}
                              onClick={() => openPhotoPreview(item)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  openPhotoPreview(item)
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              className={cn(
                                'relative h-20 w-20 shrink-0 cursor-grab overflow-hidden rounded-lg border bg-gray-100 shadow-sm outline-none ring-offset-2 transition-opacity focus-visible:ring-2 focus-visible:ring-[#003580]/40 active:cursor-grabbing',
                                pending ? 'border-dashed border-[#003580]/40' : 'border-gray-200/90',
                                draggingPhotoId === item.id && 'opacity-55'
                              )}
                              title="Drag to reorder · click to preview"
                            >
                              <img
                                src={src}
                                alt=""
                                className="pointer-events-none h-full w-full object-cover"
                                loading="eager"
                                decoding="async"
                                width={80}
                                height={80}
                              />
                              {index === 0 ? (
                                <span className="absolute bottom-0 left-0 right-0 bg-[#003580]/92 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-white">
                                  Main
                                </span>
                              ) : null}
                              <span
                                className="pointer-events-none absolute left-0.5 top-0.5 rounded bg-black/40 p-0.5 text-white/90"
                                aria-hidden
                              >
                                <GripVertical className="h-3 w-3" />
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removePhotoItem(item.id)
                                }}
                                className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white hover:bg-red-600"
                                aria-label="Remove photo"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-0.5 rounded-md border border-gray-200/90 bg-white p-0.5 shadow-sm">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  movePhoto(index, -1)
                                }}
                                className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-30"
                                aria-label="Move earlier"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === photoItems.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  movePhoto(index, 1)
                                }}
                                className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-30"
                                aria-label="Move later"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/60 py-8 text-center sm:flex-row sm:py-6">
                      <ImageIcon className="h-8 w-8 shrink-0 text-gray-300" aria-hidden />
                      <p className="max-w-sm px-2 text-sm text-muted-foreground">
                        No photos yet. When you pick files below, small square previews appear here immediately — before
                        you save the room.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl border-2 border-dashed border-gray-200 bg-white p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id={photoInputId}
                    onChange={handleImagePick}
                    disabled={photoItems.length >= MAX_IMAGES}
                    className="sr-only"
                  />
                  <label
                    htmlFor={photoInputId}
                    className={cn(
                      'flex cursor-pointer flex-col items-center gap-2',
                      photoItems.length >= MAX_IMAGES && 'pointer-events-none opacity-50'
                    )}
                  >
                    <Upload className="h-9 w-9 text-[#003580]/50" aria-hidden />
                    <span className="text-sm font-semibold text-gray-900">Add photos</span>
                    <span className="text-xs text-muted-foreground">
                      Choose one or many from your device — previews update instantly
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className={btnGhost}
                  disabled={saving}
                  onClick={() => {
                    setMode('list')
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" className={cn(btnPrimary, 'shadow-sm')} disabled={saving} onClick={() => void handleSave()}>
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add room'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {typeof document !== 'undefined' &&
      photoLightbox &&
      createPortal(
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPhotoLightbox(null)}
          role="presentation"
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/15 p-2.5 text-white transition-colors hover:bg-white/25"
            onClick={(e) => {
              e.stopPropagation()
              setPhotoLightbox(null)
            }}
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="flex max-h-[min(85vh,720px)] max-w-full flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <img
              src={photoLightbox.src}
              alt=""
              className="max-h-[min(78vh,680px)] max-w-[min(96vw,56rem)] rounded-lg object-contain shadow-2xl"
            />
            <p
              className="mt-4 max-w-[min(96vw,56rem)] truncate px-2 text-center text-sm font-medium text-white/95"
              title={photoLightbox.fileName}
            >
              {photoLightbox.fileName}
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
