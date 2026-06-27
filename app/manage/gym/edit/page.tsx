'use client'

import { useEffect, useState, Suspense, useRef, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GymDescriptionEditor } from '@/components/manage/gym-description-editor'
import { GymPhotoTour, GymPhotoTourHeaderActions } from '@/components/manage/gym-photo-tour'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import type { Gym, GymImage, Package } from '@/lib/types/database'
import { PackagesSection } from '@/components/manage/packages-section'
import { PackageCreateShell, PackageEditShell } from '@/components/manage/package-edit-shell'
import { GymAmenitiesEditor } from '@/components/manage/gym-amenities-editor'
import { GymEditLayout } from '@/components/manage/gym-edit-layout'
import { GymEditPanel } from '@/components/manage/gym-edit-section'
import { resolveGymEditSection } from '@/components/manage/gym-edit-sidebar'
import { countEnabledAmenities } from '@/lib/constants/gym-amenities'
import { GymCurrencyPicker } from '@/components/manage/gym-currency-picker'
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'
import { normalizeGymCurrency } from '@/lib/constants/gym-currencies'
import { cn } from '@/lib/utils'
import {
  lowestSearchPricePerDay,
  type PackageSearchPriceRow,
} from '@/lib/manage/gym-search-listing-price'
import { syncGymSearchPrice } from '@/lib/manage/sync-gym-search-price'
import {
  DEFAULT_GYM_AMENITIES,
  GYM_AMENITY_ORDER,
  mergeGymAmenitiesFromDb,
} from '@/lib/constants/gym-amenities'
import { AdminDeleteGymSection } from '@/components/admin/admin-delete-gym-section'
import { GymLocationEditor } from '@/components/manage/gym-location-editor'
import { TrainingScheduleImportPanel } from '@/components/manage/training-schedule-import-panel'
import { TRAINING_SCHEDULE_DAYS } from '@/lib/manage/training-schedule'
import {
  serializeManagedImageRef,
  uploadGymImageWithVariants,
} from '@/lib/images/gym-image-variants'
import { hasNonLatinChars } from '@/lib/geo/nominatim-address'
import {
  resolvePostGymEditReturnPath,
} from '@/lib/navigation/manage-gym-edit-return'
import { dispatchVerificationMilestone } from '@/lib/manage/verification-milestone-toast'
import {
  commitGalleryOrderOnSave,
  enqueueGymImageUploads,
  removeGymImageUpload,
  setGalleryOrderForGym,
  subscribeGymImageUploadComplete,
  buildGalleryOrderWithPendingUploads,
  getGymImageUploads,
  type GalleryOrderSnapshotItem,
} from '@/lib/manage/gym-image-upload-manager'
import { useGymImageUploads } from '@/lib/hooks/use-gym-image-uploads'
import {
  commitTrainerPhotosOnSave,
  enqueueTrainerPhotoUpload,
  getTrainerPhotoUpload,
  removeTrainerPhotoUpload,
  resolveTrainerRowsForSave,
  type TrainerPhotoCommitSlot,
} from '@/lib/manage/trainer-photo-upload-manager'
import { useTrainerPhotoUploads } from '@/lib/hooks/use-trainer-photo-uploads'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const DISCIPLINES = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']
const COUNTRY_CURRENCY_HINT: Record<string, string> = {
  Thailand: 'THB',
  Indonesia: 'IDR',
  Singapore: 'SGD',
  Malaysia: 'MYR',
  Vietnam: 'VND',
  Philippines: 'PHP',
  Japan: 'JPY',
  'South Korea': 'KRW',
  China: 'CNY',
  'Hong Kong': 'HKD',
  India: 'INR',
  Australia: 'AUD',
  'New Zealand': 'NZD',
  Canada: 'CAD',
  'United Kingdom': 'GBP',
  Ireland: 'EUR',
  France: 'EUR',
  Germany: 'EUR',
  Spain: 'EUR',
  Italy: 'EUR',
  Portugal: 'EUR',
  Netherlands: 'EUR',
  Belgium: 'EUR',
  Austria: 'EUR',
  Greece: 'EUR',
  Finland: 'EUR',
  Sweden: 'EUR',
  Norway: 'EUR',
  Denmark: 'EUR',
  Switzerland: 'EUR',
  'United States': 'USD',
}
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

type GalleryOrderItem = GalleryOrderSnapshotItem

function reorderGymImagesForGallery(
  images: GymImage[] | undefined,
  gallery: GalleryOrderItem[],
): GymImage[] {
  if (!images?.length) return []
  const imageById = new Map(images.map((img) => [img.id, img]))
  return gallery
    .filter((item): item is { kind: 'saved'; imageId: string } => item.kind === 'saved')
    .map((item, idx) => {
      const img = imageById.get(item.imageId)
      return img ? { ...img, order: idx } : null
    })
    .filter((img): img is GymImage => img != null)
}

function formFieldValue(formData: FormData, name: string, fallback: string): string {
  const raw = formData.get(name)
  return typeof raw === 'string' ? raw : fallback
}

interface GymWithImages extends Gym {
  images: GymImage[]
  opening_hours?: any
  trainers?: any
  faq?: any
}

type PackageEditorMode =
  | { kind: 'edit'; package: Package }
  | { kind: 'create' }
  | null

type TrainerFormRow = {
  clientKey: string
  name: string
  discipline: string
  experience: string
  photo_url?: string | null
  description?: string
}

function newTrainerClientKey(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `trainer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizeTrainerRow(raw: unknown): TrainerFormRow {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    clientKey: typeof row.clientKey === 'string' ? row.clientKey : newTrainerClientKey(),
    name: typeof row.name === 'string' ? row.name : '',
    discipline: typeof row.discipline === 'string' ? row.discipline : '',
    experience: typeof row.experience === 'string' ? row.experience : '',
    photo_url: typeof row.photo_url === 'string' ? row.photo_url : null,
    description: typeof row.description === 'string' ? row.description : '',
  }
}

function EditGymForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gymId = searchParams.get('id')
  const sectionFromUrl = searchParams.get('section')
  const returnToRaw = searchParams.get('returnTo')
  const { user, profile, loading: authLoading } = useAuth()

  const afterEditPath = useMemo(() => {
    // Admins shouldn't bounce through `/manage` (it redirects them to `/`).
    // When no explicit `returnTo` is provided, send them back to the admin gyms list.
    if (!returnToRaw && profile?.role === 'admin') return '/admin/gyms'
    return resolvePostGymEditReturnPath(returnToRaw)
  }, [returnToRaw, profile?.role])
  const [gym, setGym] = useState<GymWithImages | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [packageEditorMode, setPackageEditorMode] = useState<PackageEditorMode>(null)
  const [packagesListRefreshKey, setPackagesListRefreshKey] = useState(0)
  const [packageSearchPrice, setPackageSearchPrice] = useState<number | null>(null)
  const [packageCount, setPackageCount] = useState(0)
  const activeSection = resolveGymEditSection(sectionFromUrl)

  // Form State
  const [tagline, setTagline] = useState('')
  const [gymName, setGymName] = useState('')
  const [description, setDescription] = useState('')
  const [pricePerDay, setPricePerDay] = useState('')
  const [pricePerWeek, setPricePerWeek] = useState('')
  const [googleMapsLink, setGoogleMapsLink] = useState('')
  const [instagramLink, setInstagramLink] = useState('')
  const [facebookLink, setFacebookLink] = useState('')
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [amenities, setAmenities] = useState<Record<string, boolean>>(() => ({
    ...DEFAULT_GYM_AMENITIES,
  }))
  const [galleryOrder, setGalleryOrder] = useState<GalleryOrderItem[]>([])
  const galleryOrderRef = useRef<GalleryOrderItem[]>([])
  galleryOrderRef.current = galleryOrder
  const [pendingPreviewUrls, setPendingPreviewUrls] = useState<Record<string, string>>({})
  const pendingPreviewUrlsRef = useRef<Record<string, string>>({})
  pendingPreviewUrlsRef.current = pendingPreviewUrls
  const [transitionPreviewUrls, setTransitionPreviewUrls] = useState<Record<string, string>>({})
  const nextImageOrderRef = useRef(0)
  const uploadCompleteChainRef = useRef(Promise.resolve())
  const { uploads: pendingUploads } = useGymImageUploads(gymId ?? undefined)
  const { uploads: pendingTrainerUploads } = useTrainerPhotoUploads(gymId ?? undefined)

  const focusFrameRef = useRef<HTMLDivElement | null>(null)
  const focusDraggingRef = useRef(false)

  const [focusModal, setFocusModal] = useState<{
    open: boolean
    imageId: string | null
    imageUrl: string | null
    focusX: number
    focusY: number
    saving: boolean
    error: string | null
  }>({
    open: false,
    imageId: null,
    imageUrl: null,
    focusX: 0.5,
    focusY: 0.5,
    saving: false,
    error: null,
  })
  const saveInProgressRef = useRef(false)
  const gymFormHydratedRef = useRef(false)
  const [imageDragEnabled, setImageDragEnabled] = useState(false)
  const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<number | null>(null)

  const galleryDisplayItems = useMemo(() => {
    if (!gym) return []
    return galleryOrder
      .map((item, index) => {
        if (item.kind === 'saved') {
          const image = gym.images?.find((img) => img.id === item.imageId)
          if (image) {
            return { kind: 'saved' as const, key: item.imageId, index, image }
          }
          const transitionPreview = transitionPreviewUrls[item.imageId]
          if (transitionPreview) {
            return {
              kind: 'transition' as const,
              key: item.imageId,
              index,
              previewUrl: transitionPreview,
            }
          }
          return null
        }
        const pending = pendingUploads.find((p) => p.id === item.pendingId)
        const previewUrl = pendingPreviewUrls[item.pendingId] ?? pending?.previewUrl
        if (!previewUrl) return null
        const status = pending?.status ?? 'uploading'
        return {
          kind: 'pending' as const,
          key: item.pendingId,
          index,
          pending: pending ?? {
            id: item.pendingId,
            gymId: gym.id,
            file: new File([], 'pending'),
            previewUrl,
            order: index,
            status,
          },
        }
      })
      .filter((x): x is NonNullable<typeof x> => x != null)
  }, [galleryOrder, gym, pendingUploads, pendingPreviewUrls, transitionPreviewUrls])
  const [trainingScheduleExpanded, setTrainingScheduleExpanded] = useState(false)
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  })
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('USD')
  const currencyTouchedRef = useRef(false)

  useEffect(() => {
    if (!selectedCountry) return
    if (currencyTouchedRef.current) return
    const hinted = COUNTRY_CURRENCY_HINT[selectedCountry]
    if (!hinted) return
    setSelectedCurrencyCode((prev) => (prev === hinted ? prev : hinted))
  }, [selectedCountry])
  const [locationAddress, setLocationAddress] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [cityNonLatinWarning, setCityNonLatinWarning] = useState(false)
  const [locationLat, setLocationLat] = useState('')
  const [locationLng, setLocationLng] = useState('')

  // Additional optional fields
  const [openingHours, setOpeningHours] = useState<Record<string, string>>({
    monday: '07:00-20:00',
    tuesday: '07:00-20:00',
    wednesday: '07:00-20:00',
    thursday: '07:00-20:00',
    friday: '07:00-20:00',
    saturday: '08:00-18:00',
    sunday: 'closed',
  })
  const [trainingSchedule, setTrainingSchedule] = useState<Record<string, Array<{ time: string; type?: string }>>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  })
  const [trainers, setTrainers] = useState<TrainerFormRow[]>([])
  const [trainerPhotoUploadIds, setTrainerPhotoUploadIds] = useState<Record<string, string>>({})
  const [faq, setFaq] = useState<Array<{ question: string; answer: string }>>([])

  // Get cache key for this gym
  const getCacheKey = () => gymId ? `gym_edit_${gymId}` : null

  // Save form state to localStorage
  const saveFormState = () => {
    const cacheKey = getCacheKey()
    if (!cacheKey) return

    try {
      const formState = {
        gymName,
        description,
        tagline,
        pricePerDay,
        pricePerWeek,
        googleMapsLink,
        instagramLink,
        facebookLink,
        disciplines,
        amenities,
        selectedCountry,
        selectedCurrencyCode,
        locationAddress,
        locationCity,
        locationLat,
        locationLng,
        openingHours,
        trainingSchedule,
        trainers,
        faq,
        // Note: newImages (File objects) can't be serialized, so we skip them
        timestamp: Date.now(),
      }
      localStorage.setItem(cacheKey, JSON.stringify(formState))
    } catch (error) {
      console.error('Failed to save form state to localStorage:', error)
    }
  }

  /** Restores cached edit state. `restoredLocationFromCache` is true when cache included location fields (in-progress address survives refresh). */
  const restoreFormState = (): {
    hasCachedState: boolean
    restoredLocationFromCache: boolean
    restoredBasicFieldsFromCache: boolean
  } => {
    const cacheKey = getCacheKey()
    if (!cacheKey) {
      return { hasCachedState: false, restoredLocationFromCache: false, restoredBasicFieldsFromCache: false }
    }

    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) {
        return { hasCachedState: false, restoredLocationFromCache: false, restoredBasicFieldsFromCache: false }
      }

      const formState = JSON.parse(cached)

      // Only restore if cache is less than 24 hours old
      const cacheAge = Date.now() - (formState.timestamp || 0)
      if (cacheAge > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(cacheKey)
        return { hasCachedState: false, restoredLocationFromCache: false, restoredBasicFieldsFromCache: false }
      }

      let restoredBasicFieldsFromCache = false
      if (typeof formState.gymName === 'string') {
        setGymName(formState.gymName)
        restoredBasicFieldsFromCache = true
      }
      if (typeof formState.description === 'string') {
        setDescription(formState.description)
        restoredBasicFieldsFromCache = true
      }
      if (typeof formState.tagline === 'string') {
        setTagline(formState.tagline)
        restoredBasicFieldsFromCache = true
      }
      if (typeof formState.pricePerDay === 'string') {
        setPricePerDay(formState.pricePerDay)
        restoredBasicFieldsFromCache = true
      }
      if (typeof formState.pricePerWeek === 'string') {
        setPricePerWeek(formState.pricePerWeek)
        restoredBasicFieldsFromCache = true
      }
      if (typeof formState.googleMapsLink === 'string') {
        setGoogleMapsLink(formState.googleMapsLink)
        restoredBasicFieldsFromCache = true
      }
      if (typeof formState.instagramLink === 'string') {
        setInstagramLink(formState.instagramLink)
        restoredBasicFieldsFromCache = true
      }
      if (typeof formState.facebookLink === 'string') {
        setFacebookLink(formState.facebookLink)
        restoredBasicFieldsFromCache = true
      }

      // Restore form state
      if (formState.disciplines) setDisciplines(formState.disciplines)
      if (formState.amenities) setAmenities(mergeGymAmenitiesFromDb(formState.amenities))
      if (formState.selectedCountry) setSelectedCountry(formState.selectedCountry)
      if (formState.selectedCurrencyCode) {
        setSelectedCurrencyCode(normalizeGymCurrency(formState.selectedCurrencyCode, 'USD'))
        currencyTouchedRef.current = true
      }
      if (formState.openingHours) setOpeningHours(formState.openingHours)
      if (formState.trainingSchedule) setTrainingSchedule(formState.trainingSchedule)
      if (formState.trainers) {
        setTrainers(
          (Array.isArray(formState.trainers) ? formState.trainers : []).map((t: unknown) =>
            normalizeTrainerRow(t),
          ),
        )
      }
      if (formState.faq) setFaq(formState.faq)

      const loc = formState as Record<string, unknown>
      const hasLocationCache =
        'locationAddress' in loc ||
        'locationCity' in loc ||
        'locationLat' in loc ||
        'locationLng' in loc
      let restoredLocationFromCache = false
      if (hasLocationCache) {
        setLocationAddress(typeof loc.locationAddress === 'string' ? loc.locationAddress : '')
        const cachedCity = typeof loc.locationCity === 'string' ? loc.locationCity : ''
        setLocationCity(cachedCity)
        if (hasNonLatinChars(cachedCity)) setCityNonLatinWarning(true)
        setLocationLat(typeof loc.locationLat === 'string' ? loc.locationLat : '')
        setLocationLng(typeof loc.locationLng === 'string' ? loc.locationLng : '')
        restoredLocationFromCache = true
      }

      return { hasCachedState: true, restoredLocationFromCache, restoredBasicFieldsFromCache }
    } catch (error) {
      console.error('Failed to restore form state from localStorage:', error)
      return { hasCachedState: false, restoredLocationFromCache: false, restoredBasicFieldsFromCache: false }
    }
  }

  // Clear cached form state
  const clearFormState = () => {
    const cacheKey = getCacheKey()
    if (cacheKey) {
      localStorage.removeItem(cacheKey)
    }
  }

  // Auto-save form state whenever it changes
  useEffect(() => {
    if (!gymId || loading) return
    saveFormState()
  }, [
    gymName,
    description,
    tagline,
    pricePerDay,
    pricePerWeek,
    googleMapsLink,
    instagramLink,
    facebookLink,
    disciplines,
    amenities,
    selectedCountry,
    selectedCurrencyCode,
    locationAddress,
    locationCity,
    locationLat,
    locationLng,
    openingHours,
    trainingSchedule,
    trainers,
    faq,
    gymId,
    loading,
  ])

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    if (!gymId || loading) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const cacheKey = getCacheKey()
      if (cacheKey && localStorage.getItem(cacheKey)) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [gymId, loading])

  useEffect(() => {
    gymFormHydratedRef.current = false
  }, [gymId])

  useEffect(() => {
    if (authLoading) return
    
    if (!user || (profile?.role !== 'owner' && profile?.role !== 'admin')) {
      setErrorMsg('Unauthorized: You must be a gym owner or admin.')
      return
    }
    
    if (gymId) {
      fetchGym(gymId)
    } else {
      setErrorMsg('No gym ID provided.')
      setLoading(false)
    }
  }, [user, profile, gymId, authLoading])

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const sync = () => setImageDragEnabled(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!gymId) return
    setGalleryOrderForGym(gymId, galleryOrder)
  }, [gymId, galleryOrder])

  useEffect(() => {
    if (!gymId) return

    const applyUploadComplete = (pendingId: string, image: GymImage) => {
      const previewUrl = pendingPreviewUrlsRef.current[pendingId]
      const nextGalleryOrder = galleryOrderRef.current.map((item) =>
        item.kind === 'pending' && item.pendingId === pendingId
          ? { kind: 'saved' as const, imageId: image.id }
          : item,
      )
      galleryOrderRef.current = nextGalleryOrder
      setGalleryOrderForGym(gymId, nextGalleryOrder)
      setGalleryOrder(nextGalleryOrder)

      setPendingPreviewUrls((prev) => {
        if (!(pendingId in prev)) return prev
        const next = { ...prev }
        delete next[pendingId]
        return next
      })

      if (previewUrl) {
        setTransitionPreviewUrls((prev) => ({ ...prev, [image.id]: previewUrl }))
      }

      setGym((prev) => {
        if (!prev || prev.id !== gymId) return prev
        const createMutableCopy = (obj: unknown) => {
          if (typeof structuredClone !== 'undefined') return structuredClone(obj)
          return JSON.parse(JSON.stringify(obj))
        }
        const images = (prev.images || []).some((img) => img.id === image.id)
          ? [...(prev.images || [])]
          : [...(prev.images || []), image]
        return {
          ...createMutableCopy(prev),
          images: reorderGymImagesForGallery(images, nextGalleryOrder),
        } as GymWithImages
      })
    }

    return subscribeGymImageUploadComplete(({ gymId: gId, pendingId, image }) => {
      if (gId !== gymId) return
      uploadCompleteChainRef.current = uploadCompleteChainRef.current.then(() => {
        applyUploadComplete(pendingId, image)
      })
    })
  }, [gymId])

  useEffect(() => {
    if (!gym?.images?.length) return
    const savedIds = new Set(gym.images.map((img) => img.id))
    setTransitionPreviewUrls((prev) => {
      let changed = false
      const next = { ...prev }
      for (const imageId of Object.keys(next)) {
        if (!savedIds.has(imageId)) continue
        URL.revokeObjectURL(next[imageId])
        delete next[imageId]
        changed = true
      }
      return changed ? next : prev
    })
  }, [gym?.images])

  const fetchGym = async (id: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('gyms')
      .select(`
        *,
        images:gym_images(*)
      `)
      .eq('id', id)
      .single()
    
    // Sort images by order
    if (data?.images) {
      data.images.sort((a: GymImage, b: GymImage) => (a.order || 0) - (b.order || 0))
      const maxOrder = Math.max(...data.images.map((img: GymImage) => img.order || 0), -1)
      nextImageOrderRef.current = maxOrder + 1
    } else {
      nextImageOrderRef.current = 0
    }

    if (error) {
      setErrorMsg(`Error fetching gym: ${error.message}`)
      setLoading(false)
      return
    }

    // Allow admins to edit any gym, owners can only edit their own
    if (profile?.role !== 'admin' && data.owner_id !== user?.id) {
      setErrorMsg('You do not own this gym.')
      setLoading(false)
      return
    }

    // Create a deep mutable copy to avoid readonly property errors
    // Use structuredClone if available, otherwise JSON parse/stringify
    const createMutableCopy = (obj: any): any => {
      if (typeof structuredClone !== 'undefined') {
        return structuredClone(obj)
      }
      return JSON.parse(JSON.stringify(obj))
    }
    
    const mutableGym = createMutableCopy(data)
    if (mutableGym.images) {
      mutableGym.images = [...mutableGym.images]
    }
    setGym(mutableGym as any)
    const savedGalleryOrder = (mutableGym.images || []).map((img: GymImage) => ({
      kind: 'saved' as const,
      imageId: img.id,
    }))
    const mergedGalleryOrder = buildGalleryOrderWithPendingUploads(id, savedGalleryOrder)
    const previews: Record<string, string> = {}
    for (const entry of getGymImageUploads(id)) {
      previews[entry.id] = entry.previewUrl
    }
    galleryOrderRef.current = mergedGalleryOrder
    setGalleryOrder(mergedGalleryOrder)
    setPendingPreviewUrls(previews)
    setGalleryOrderForGym(id, mergedGalleryOrder)

    if (!gymFormHydratedRef.current) {
      gymFormHydratedRef.current = true

      // Try to restore cached form state first
      const { hasCachedState, restoredLocationFromCache, restoredBasicFieldsFromCache } =
        restoreFormState()

      const initBasicFieldsFromDb = () => {
        setGymName(data.name || '')
        setDescription(data.description || '')
        setTagline((data as { tagline?: string | null }).tagline || '')
        setPricePerDay(data.price_per_day != null ? String(data.price_per_day) : '')
        setPricePerWeek(data.price_per_week != null ? String(data.price_per_week) : '')
        setGoogleMapsLink((data as { google_maps_link?: string | null }).google_maps_link || '')
        setInstagramLink((data as { instagram_link?: string | null }).instagram_link || '')
        setFacebookLink((data as { facebook_link?: string | null }).facebook_link || '')
      }

      if (!hasCachedState || !restoredBasicFieldsFromCache) {
        initBasicFieldsFromDb()
      }

      if (!restoredLocationFromCache) {
        setLocationAddress(data.address || '')
        const loadedCity = data.city || ''
        setLocationCity(loadedCity)
        if (hasNonLatinChars(loadedCity)) setCityNonLatinWarning(true)
        setLocationLat(
          data.latitude != null && !Number.isNaN(Number(data.latitude)) ? String(data.latitude) : '',
        )
        setLocationLng(
          data.longitude != null && !Number.isNaN(Number(data.longitude)) ? String(data.longitude) : '',
        )
      }

      // If no cached state, use data from database
      if (!hasCachedState) {
        setSelectedCountry(data.country || '')
        setDisciplines(data.disciplines || [])
      }

      // Currency should reflect DB on load (not cached)
      setSelectedCurrencyCode(normalizeGymCurrency(data.currency, 'USD'))
      currencyTouchedRef.current = false

      if (!hasCachedState) {
        setAmenities(mergeGymAmenitiesFromDb(data.amenities))
      } else {
        setAmenities((prev) => {
          const fromDb = mergeGymAmenitiesFromDb(data.amenities)
          const out = { ...fromDb }
          for (const k of GYM_AMENITY_ORDER) {
            if (k in prev) out[k] = prev[k] as boolean
          }
          return out
        })
      }

      // Load optional fields (only if not cached)
      if (!hasCachedState) {
        if (data.opening_hours) {
          setOpeningHours(data.opening_hours)
        }
        if (data.training_schedule) {
          // Handle both old string format and new array format
          const schedule = data.training_schedule
          if (typeof schedule === 'object' && !Array.isArray(schedule)) {
            const converted: Record<string, Array<{ time: string; type?: string }>> = {}
            DAYS_OF_WEEK.forEach((day) => {
              if (schedule[day]) {
                if (typeof schedule[day] === 'string') {
                  // Old format: convert string to array
                  converted[day] = [{ time: schedule[day] }]
                } else if (Array.isArray(schedule[day])) {
                  // New format: already array - create a new mutable array copy to avoid readonly issues
                  converted[day] = Array.from(schedule[day]).map((session) => ({
                    time: session.time || '',
                    type: session.type || '',
                  }))
                } else {
                  converted[day] = []
                }
              } else {
                converted[day] = []
              }
            })
            setTrainingSchedule(converted)
          } else {
            // Initialize empty if not present
            const empty: Record<string, Array<{ time: string; type?: string }>> = {}
            DAYS_OF_WEEK.forEach((day) => {
              empty[day] = []
            })
            setTrainingSchedule(empty)
          }
        }
        if (data.trainers && Array.isArray(data.trainers)) {
          setTrainers(data.trainers.map((t: unknown) => normalizeTrainerRow(t)))
        }
        if (data.faq && Array.isArray(data.faq)) {
          setFaq(data.faq)
        }
      }
    }

    setLoading(false)
  }

  const refreshPackageSearchPrice = useCallback(async () => {
    if (!gym?.id) {
      setPackageSearchPrice(null)
      setPackageCount(0)
      return
    }

    const supabase = createClient()
    const listingCurrency = normalizeGymCurrency(selectedCurrencyCode || gym.currency, 'USD')
    const { data } = await supabase
      .from('packages')
      .select(
        'price_per_day, once_daily_price_per_day, currency, pricing_config, variants:package_variants(price_per_day, once_daily_price_per_day)',
      )
      .eq('gym_id', gym.id)

    const rows = (data ?? []) as PackageSearchPriceRow[]
    setPackageCount(rows.length)
    const lowest = lowestSearchPricePerDay(rows, listingCurrency)
    setPackageSearchPrice(lowest)
    if (lowest !== null) {
      setPricePerDay(String(lowest))
    }
  }, [gym?.id, gym?.currency, selectedCurrencyCode])

  useEffect(() => {
    void refreshPackageSearchPrice()
  }, [refreshPackageSearchPrice, packagesListRefreshKey])

  const handleDisciplineToggle = (discipline: string) => {
    setDisciplines(prev => 
      prev.includes(discipline)
        ? prev.filter(d => d !== discipline)
        : [...prev, discipline]
    )
  }

  const handleAmenityChange = (key: string, checked: boolean) => {
    setAmenities(prev => ({ ...prev, [key]: checked }))
  }

  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !gym?.id) return
    const files = Array.from(e.target.files)
    const currentCount = galleryOrderRef.current.length
    const remainingSlots = 30 - currentCount
    if (remainingSlots <= 0) {
      alert('Maximum 30 images allowed')
      e.target.value = ''
      return
    }
    const toAdd = files.slice(0, remainingSlots)
    const added = enqueueGymImageUploads(gym.id, toAdd, currentCount)
    setPendingPreviewUrls((prev) => {
      const next = { ...prev }
      for (const entry of added) next[entry.id] = entry.previewUrl
      return next
    })
    const nextGalleryOrder = [
      ...galleryOrderRef.current,
      ...added.map((p) => ({ kind: 'pending' as const, pendingId: p.id })),
    ]
    galleryOrderRef.current = nextGalleryOrder
    setGalleryOrder(nextGalleryOrder)
    setGalleryOrderForGym(gym.id, nextGalleryOrder)
    e.target.value = ''
  }

  const removePendingImage = (pendingId: string) => {
    removeGymImageUpload(pendingId)
    setPendingPreviewUrls((prev) => {
      const url = prev[pendingId]
      if (url) URL.revokeObjectURL(url)
      const next = { ...prev }
      delete next[pendingId]
      return next
    })
    setGalleryOrder((prev) =>
      prev.filter((item) => !(item.kind === 'pending' && item.pendingId === pendingId)),
    )
  }

  const deleteExistingImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('gym_images')
      .delete()
      .eq('id', imageId)

    if (error) {
      alert('Failed to delete image')
      return
    }

    setGalleryOrder((prev) =>
      prev.filter((item) => !(item.kind === 'saved' && item.imageId === imageId)),
    )
    setGym((prev) => {
      if (!prev) return prev
      const createMutableCopy = (obj: any): any => {
        if (typeof structuredClone !== 'undefined') return structuredClone(obj)
        return JSON.parse(JSON.stringify(obj))
      }
      return {
        ...createMutableCopy(prev),
        images: (prev.images || []).filter((img) => img.id !== imageId),
      }
    })
  }

  const openFocusAdjust = (img: GymImage) => {
    const fx = typeof (img as any).focus_x === 'number' ? (img as any).focus_x : 0.5
    const fy = typeof (img as any).focus_y === 'number' ? (img as any).focus_y : 0.5
    setFocusModal({
      open: true,
      imageId: img.id,
      imageUrl: img.url,
      focusX: Number.isFinite(fx) ? fx : 0.5,
      focusY: Number.isFinite(fy) ? fy : 0.5,
      saving: false,
      error: null,
    })
  }

  const setFocusFromClientPoint = (clientX: number, clientY: number) => {
    const el = focusFrameRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
    setFocusModal((p) => ({ ...p, focusX: clamp01(x), focusY: clamp01(y) }))
  }

  const saveFocusAdjust = async () => {
    if (!focusModal.imageId) return
    const supabase = createClient()
    setFocusModal((p) => ({ ...p, saving: true, error: null }))
    const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
    const focus_x = clamp01(focusModal.focusX)
    const focus_y = clamp01(focusModal.focusY)
    const { error } = await supabase
      .from('gym_images')
      .update({ focus_x, focus_y })
      .eq('id', focusModal.imageId)
    if (error) {
      setFocusModal((p) => ({ ...p, saving: false, error: error.message || 'Failed to save focal point' }))
      return
    }
    setGym((prev) => {
      if (!prev) return prev
      const nextImages = (prev.images || []).map((img) =>
        img.id === focusModal.imageId ? ({ ...(img as any), focus_x, focus_y } as any) : img
      )
      return { ...(prev as any), images: nextImages }
    })
    setFocusModal((p) => ({ ...p, saving: false, open: false }))
  }

  const handleDragStart = (index: number) => {
    setDraggedGalleryIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleGalleryDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedGalleryIndex === null || draggedGalleryIndex === dropIndex) {
      setDraggedGalleryIndex(null)
      return
    }

    const nextGalleryOrder = [...galleryOrderRef.current]
    const [moved] = nextGalleryOrder.splice(draggedGalleryIndex, 1)
    nextGalleryOrder.splice(dropIndex, 0, moved)
    galleryOrderRef.current = nextGalleryOrder
    setGalleryOrder(nextGalleryOrder)

    setGym((prev) => {
      if (!prev) return prev
      const createMutableCopy = (obj: any): any => {
        if (typeof structuredClone !== 'undefined') return structuredClone(obj)
        return JSON.parse(JSON.stringify(obj))
      }
      return {
        ...createMutableCopy(prev),
        images: reorderGymImagesForGallery(prev.images, nextGalleryOrder),
      }
    })

    setDraggedGalleryIndex(null)
  }

  const addTrainer = () => {
    setTrainers([
      ...trainers,
      {
        clientKey: newTrainerClientKey(),
        name: '',
        discipline: '',
        experience: '',
        photo_url: null,
        description: '',
      },
    ])
  }

  const removeTrainer = (clientKey: string) => {
    const uploadId = trainerPhotoUploadIds[clientKey]
    if (uploadId) removeTrainerPhotoUpload(uploadId)
    setTrainerPhotoUploadIds((prev) => {
      const next = { ...prev }
      delete next[clientKey]
      return next
    })
    setTrainers(trainers.filter((t) => t.clientKey !== clientKey))
  }

  const updateTrainer = (
    clientKey: string,
    field: Exclude<keyof TrainerFormRow, 'clientKey'>,
    value: string,
  ) => {
    setTrainers((prev) =>
      prev.map((t) => (t.clientKey === clientKey ? { ...t, [field]: value } : t)),
    )
  }

  const setTrainerPhotoFile = (clientKey: string, file: File | null) => {
    if (!gym?.id) return
    const prevUploadId = trainerPhotoUploadIds[clientKey]
    if (prevUploadId) removeTrainerPhotoUpload(prevUploadId)

    if (!file) {
      setTrainerPhotoUploadIds((prev) => {
        const next = { ...prev }
        delete next[clientKey]
        return next
      })
      return
    }

    const entry = enqueueTrainerPhotoUpload(gym.id, clientKey, file)
    setTrainerPhotoUploadIds((prev) => ({ ...prev, [clientKey]: entry.id }))
  }

  const trainerPhotoDisplay = (trainer: TrainerFormRow) => {
    const uploadId = trainerPhotoUploadIds[trainer.clientKey]
    const pending =
      pendingTrainerUploads.find((u) => u.id === uploadId) ??
      (uploadId ? getTrainerPhotoUpload(uploadId) : undefined)
    const src = pending?.previewUrl ?? trainer.photo_url ?? null
    const uploading = pending && (pending.status === 'queued' || pending.status === 'uploading')
    const failed = pending?.status === 'failed'
    return { src, uploading: Boolean(uploading), failed: Boolean(failed) }
  }

  const addFaq = () => {
    setFaq([...faq, { question: '', answer: '' }])
  }

  const removeFaq = (index: number) => {
    setFaq(faq.filter((_, i) => i !== index))
  }

  const updateFaq = (index: number, field: string, value: string) => {
    const updated = [...faq]
    updated[index] = { ...updated[index], [field]: value }
    setFaq(updated)
  }

  const handleSave = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    if (!gym) return
    if (saveInProgressRef.current) return

    const formElement =
      e?.currentTarget || (document.getElementById('edit-gym-form') as HTMLFormElement | null)
    if (!formElement) {
      setSaveError('Form not found')
      return
    }

    saveInProgressRef.current = true
    setSaving(true)
    setSaveError(null)
    const supabase = createClient()
    const formData = new FormData(formElement)

    try {
      const trainerCommitSlots: TrainerPhotoCommitSlot[] = trainers.map((t) => {
        const uploadId = trainerPhotoUploadIds[t.clientKey]
        let photo: TrainerPhotoCommitSlot['photo']
        if (uploadId) {
          photo = { kind: 'pending', uploadId }
        } else if (t.photo_url?.trim()) {
          photo = { kind: 'saved', url: t.photo_url.trim() }
        } else {
          photo = { kind: 'none' }
        }
        return {
          clientKey: t.clientKey,
          name: t.name,
          discipline: t.discipline,
          experience: t.experience,
          description: (t.description ?? '').trim() || null,
          photo,
        }
      })

      const { rows: trainerRows, failed: trainerUploadsFailed } =
        resolveTrainerRowsForSave(trainerCommitSlots)
      if (trainerUploadsFailed) {
        throw new Error(
          'One or more trainer photos failed to upload. Remove them or pick again before saving.',
        )
      }

      const savedName = formFieldValue(formData, 'name', gymName).trim()
      const savedDescription = formFieldValue(formData, 'description', description).trim()
      const savedTagline = formFieldValue(formData, 'tagline', tagline).trim()
      const savedPricePerDay = formFieldValue(formData, 'price_per_day', pricePerDay)
      const savedPricePerWeek = formFieldValue(formData, 'price_per_week', pricePerWeek)
      const listingCurrency = normalizeGymCurrency(selectedCurrencyCode, 'USD')
      const pricePerDayToSave =
        packageSearchPrice !== null ? packageSearchPrice : parseFloat(savedPricePerDay)
      const savedGoogleMapsLink = formFieldValue(formData, 'google_maps_link', googleMapsLink).trim()
      const savedInstagramLink = formFieldValue(formData, 'instagram_link', instagramLink).trim()
      const savedFacebookLink = formFieldValue(formData, 'facebook_link', facebookLink).trim()

      const updates = {
        name: savedName,
        tagline: savedTagline || null,
        description: savedDescription,
        address: locationAddress.trim(),
        city: locationCity.trim(),
        country: selectedCountry,
        latitude: locationLat.trim() ? parseFloat(locationLat) : null,
        longitude: locationLng.trim() ? parseFloat(locationLng) : null,
        price_per_day: pricePerDayToSave,
        price_per_week: savedPricePerWeek ? parseFloat(savedPricePerWeek) : null,
        currency: selectedCurrencyCode,
        disciplines: [...disciplines], // Create new array to avoid readonly issues
        amenities: mergeGymAmenitiesFromDb(amenities),
        google_maps_link: savedGoogleMapsLink || null,
        instagram_link: savedInstagramLink || null,
        facebook_link: savedFacebookLink || null,
        opening_hours: { ...openingHours }, // Create new object to avoid readonly issues
        training_schedule: Object.fromEntries(
          Object.entries(trainingSchedule).map(([day, sessions]) => [
            day,
            [...sessions].filter(s => s.time.trim() !== '') // Create new array and filter
          ])
        ),
        training_schedule_use_image: false,
        training_schedule_image: null,
        trainers: trainerRows.filter((t) => t.name && t.discipline),
        faq: [...faq].filter(f => f.question && f.answer), // Create new array
      }

      const { error, data } = await supabase
        .from('gyms')
        .update(updates)
        .eq('id', gym.id)
        .select()

      if (error) {
        console.error('Error updating gym:', error)
        throw error
      }

      const updatedRows = Array.isArray(data) ? data : data ? [data] : []
      if (updatedRows.length === 0) {
        throw new Error(
          'Save was blocked by database permissions. Please confirm this account can edit this gym.',
        )
      }

      // Sync basic fields with what was saved so the form reflects persisted values.
      setGymName(savedName)
      setDescription(savedDescription)
      setTagline(savedTagline)
      setPricePerDay(String(pricePerDayToSave))
      setPricePerWeek(savedPricePerWeek)
      setGoogleMapsLink(savedGoogleMapsLink)
      setInstagramLink(savedInstagramLink)
      setFacebookLink(savedFacebookLink)

      // Persist gallery order in the background; still-uploading photos follow this snapshot.
      void commitGalleryOrderOnSave(gym.id, galleryOrderRef.current)

      if (trainerCommitSlots.some((t) => t.photo.kind === 'pending')) {
        commitTrainerPhotosOnSave(gym.id, trainerCommitSlots)
      }

      setTrainerPhotoUploadIds({})

      // Clear cached form state on successful save
      clearFormState()

      // Punch the ISR cache for this gym's public page so the edit appears
      // immediately instead of within the 1h revalidate window. Fire-and-forget:
      // a failure here shouldn't block the save flow.
      fetch(`/api/gyms/${gym.id}/revalidate`, { method: 'POST' }).catch(() => {})

      const nextRow = (Array.isArray(data) ? data[0] : data) as Gym | undefined
      if (nextRow) {
        const mapsDone = (r: { google_maps_link?: string | null }) => Boolean((r.google_maps_link ?? '').trim())
        const socialDone = (r: {
          instagram_link?: string | null
          facebook_link?: string | null
        }) => Boolean((r.instagram_link ?? '').trim() || (r.facebook_link ?? '').trim())
        if (!mapsDone(gym) && mapsDone(nextRow)) {
          dispatchVerificationMilestone({ kind: 'maps' })
        }
        if (!socialDone(gym) && socialDone(nextRow)) {
          dispatchVerificationMilestone({ kind: 'social' })
        }
        if (!gym.admin_approved && nextRow.admin_approved) {
          dispatchVerificationMilestone({ kind: 'admin' })
        }
      }

      router.push(afterEditPath)
    } catch (err: any) {
      console.error('Error updating gym:', err)
      setSaveError(`Update failed: ${err.message}`)
    } finally {
      saveInProgressRef.current = false
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-full min-h-0 flex-1 bg-white">
        <div className="hidden w-56 shrink-0 border-r border-gray-200/80 md:block">
          <div className="space-y-1 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-4 py-5 sm:px-8 sm:py-6">
          <div className="mx-auto max-w-2xl space-y-5">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
            <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-0 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
              <p className="text-gray-700 mb-4">{errorMsg}</p>
              <Button onClick={() => router.push(afterEditPath)}>Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!gym) return null

  const closePackageEditor = () => {
    setPackageEditorMode(null)
    setPackagesListRefreshKey((key) => key + 1)
  }

  const openPackageEditor = (mode: PackageEditorMode) => {
    saveFormState()
    setPackageEditorMode(mode)
  }

  if (packageEditorMode) {
    const listingCurrency = normalizeGymCurrency(selectedCurrencyCode || gym.currency, 'USD')

    if (packageEditorMode.kind === 'edit') {
      return (
        <PackageEditShell
          gymId={gym.id}
          currency={listingCurrency}
          package={packageEditorMode.package}
          onClose={closePackageEditor}
          onUpdated={() => setPackagesListRefreshKey((key) => key + 1)}
        />
      )
    }

    return (
      <PackageCreateShell
        gymId={gym.id}
        currency={listingCurrency}
        onClose={closePackageEditor}
        onComplete={() => setPackagesListRefreshKey((key) => key + 1)}
      />
    )
  }

  const listingCurrency = normalizeGymCurrency(selectedCurrencyCode || gym.currency, 'USD')
  const usesPackageSearchPrice = packageSearchPrice !== null

  // Calculate section completion status
  const sectionStatus = {
    basic: {
      completed: !!(
        gymName.trim() &&
        description.trim() &&
        disciplines.length > 0
      ),
      required: true,
    },
    location: { completed: !!(locationAddress && locationCity && selectedCountry), required: true },
    images: { completed: !!(gym.images && gym.images.length > 0), required: true },
    amenities: { completed: countEnabledAmenities(amenities) > 0, required: false },
    schedule: { completed: false, required: false },
    trainers: { completed: trainers.length > 0, required: false },
    packages: { completed: usesPackageSearchPrice || packageCount > 0, required: true },
  }

  return (
    <GymEditLayout
      gymId={gym.id}
      returnTo={returnToRaw}
      activeSection={activeSection}
      title={activeSection === 'images' ? 'Photo tour' : undefined}
      subtitle={
        activeSection === 'images'
          ? 'Manage photos that show your gym, mats, and training space. The first photo is your cover image on search and your public listing.'
          : undefined
      }
      headerActions={
        activeSection === 'images' ? (
          <GymPhotoTourHeaderActions
            photoCount={galleryOrder.length}
            onAddPhotos={handleNewImageSelect}
          />
        ) : undefined
      }
      sections={sectionStatus}
      contentWidth={
        activeSection === 'basic' || activeSection === 'images' || activeSection === 'location'
          ? 'full'
          : 'default'
      }
      saving={saving}
      saveError={saveError}
      onSave={() => void handleSave()}
      onCancel={() => router.push(afterEditPath)}
    >
        {activeSection !== 'packages' ? (
        <form id="edit-gym-form" onSubmit={handleSave}>
          {activeSection === 'basic' ? (
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-14">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor="name">Gym name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                      required
                    />
                  </div>
                  <GymCurrencyPicker
                    id="currency"
                    value={selectedCurrencyCode}
                    onChange={(code) => {
                      currencyTouchedRef.current = true
                      setSelectedCurrencyCode(code)
                    }}
                    required
                    compact
                    className="w-full shrink-0 sm:w-[10.5rem]"
                  />
                  <input type="hidden" name="currency" value={selectedCurrencyCode} required />
                </div>
                <input type="hidden" name="price_per_day" value={pricePerDay} />
                <input type="hidden" name="price_per_week" value={pricePerWeek} />

                <div className="space-y-2">
                  <Label htmlFor="tagline">
                    Tagline
                    <span className="ml-1.5 text-xs font-normal text-gray-400">(search cards)</span>
                  </Label>
                  <input
                    id="tagline"
                    name="tagline"
                    type="text"
                    maxLength={80}
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="e.g. Beachside Muay Thai in the heart of Krabi"
                  />
                  <p className="text-xs text-gray-400 tabular-nums">{tagline.length}/80</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="instagram_link">Instagram link</Label>
                    <Input
                      id="instagram_link"
                      name="instagram_link"
                      type="url"
                      value={instagramLink}
                      onChange={(e) => setInstagramLink(e.target.value)}
                      placeholder="https://instagram.com/yourgym"
                      required={profile?.role !== 'admin'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook_link">Facebook link (optional)</Label>
                    <Input
                      id="facebook_link"
                      name="facebook_link"
                      type="url"
                      value={facebookLink}
                      onChange={(e) => setFacebookLink(e.target.value)}
                      placeholder="https://facebook.com/yourgym"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Disciplines</Label>
                    <p className="mt-1 text-xs text-gray-500">
                      What guests can train here — used for search filters.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {DISCIPLINES.map((d) => (
                      <label
                        key={d}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                          disciplines.includes(d)
                            ? 'border-[#003580]/30 bg-[#003580]/[0.06] text-gray-900'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={disciplines.includes(d)}
                          onChange={() => handleDisciplineToggle(d)}
                          className="h-4 w-4 rounded border-gray-300 text-[#003580] focus:ring-[#003580]"
                        />
                        <span>{d}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-100 pt-8">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Label>Guest FAQs</Label>
                      <p className="mt-1 text-xs text-gray-500">
                        Optional questions and answers shown on your public listing.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                      Add question
                    </Button>
                  </div>
                  {faq.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Answer common questions about parking, gear, skill level, or what to bring.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {faq.map((item, index) => (
                        <div
                          key={index}
                          className="space-y-3 rounded-xl border border-gray-200/90 bg-gray-50/80 p-4"
                        >
                          <Input
                            placeholder="Question"
                            value={item.question}
                            onChange={(e) => updateFaq(index, 'question', e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Answer"
                              value={item.answer}
                              onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                              rows={2}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeFaq(index)}
                              className="self-start"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <GymDescriptionEditor
                id="description"
                name="description"
                value={description}
                onChange={setDescription}
                required
                className="min-h-[min(70vh,42rem)]"
              />
            </div>
          ) : null}

          {activeSection === 'location' ? (
            <GymLocationEditor
              saving={saving}
              showVerificationHints={profile?.role !== 'admin'}
              address={locationAddress}
              city={locationCity}
              country={selectedCountry}
              latitude={locationLat}
              longitude={locationLng}
              googleMapsLink={googleMapsLink}
              cityNonLatinWarning={cityNonLatinWarning}
              onAddressChange={setLocationAddress}
              onCityChange={(value) => {
                setLocationCity(value)
                if (cityNonLatinWarning) {
                  setCityNonLatinWarning(hasNonLatinChars(value))
                }
              }}
              onCityBlur={(value) => setCityNonLatinWarning(hasNonLatinChars(value))}
              onCountryChange={setSelectedCountry}
              onLatitudeChange={setLocationLat}
              onLongitudeChange={setLocationLng}
              onGoogleMapsLinkChange={setGoogleMapsLink}
              onApplySearch={({ address, city, latitude, longitude, country }) => {
                setLocationAddress(address)
                setLocationCity(city)
                setCityNonLatinWarning(hasNonLatinChars(city))
                setLocationLat(latitude)
                setLocationLng(longitude)
                if (country) setSelectedCountry(country)
              }}
            />
          ) : null}

          {activeSection === 'amenities' ? (
          <GymEditPanel contentClassName="space-y-0">
            <GymAmenitiesEditor amenities={amenities} onChange={handleAmenityChange} />
          </GymEditPanel>
          ) : null}

          {activeSection === 'images' ? (
            <GymPhotoTour
              items={galleryDisplayItems}
              imageDragEnabled={imageDragEnabled}
              draggedIndex={draggedGalleryIndex}
              pendingPreviewUrls={pendingPreviewUrls}
              onAddPhotos={handleNewImageSelect}
              onRemove={(item) => {
                if (item.kind === 'saved') {
                  void deleteExistingImage(item.image.id)
                } else if (item.kind === 'pending') {
                  removePendingImage(item.pending.id)
                } else {
                  void deleteExistingImage(item.key)
                }
              }}
              onFocus={openFocusAdjust}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleGalleryDrop}
            />
          ) : null}

          {activeSection === 'schedule' ? (
          <GymEditPanel contentClassName="space-y-6">
              {/* Opening Hours */}
              <div className="space-y-3">
                <div>
                  <Label>Gym Opening Hours (optional)</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    When is your gym facility open to the public?
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-3 max-w-2xl">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="flex items-center gap-3">
                      <Label htmlFor={`hours-${day}`} className="w-24 capitalize text-sm font-medium text-gray-700">
                        {day}:
                      </Label>
                      <Input
                        id={`hours-${day}`}
                        value={openingHours[day] || ''}
                        onChange={(e) => setOpeningHours({ ...openingHours, [day]: e.target.value })}
                        placeholder="e.g., 07:00-20:00 or closed"
                        className="w-48"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Training Schedule */}
              <div className="pt-4 border-t space-y-4">
                {gym?.id ? (
                  <TrainingScheduleImportPanel
                    gymId={gym.id}
                    currentSchedule={trainingSchedule}
                    isAdmin={profile?.role === 'admin'}
                    onApply={(schedule) => {
                      setTrainingSchedule(schedule)
                      setTrainingScheduleExpanded(true)
                      setExpandedDays((prev) => {
                        const next = { ...prev }
                        for (const day of TRAINING_SCHEDULE_DAYS) {
                          if (schedule[day]?.some((s) => s.time.trim())) {
                            next[day] = true
                          }
                        }
                        return next
                      })
                    }}
                  />
                ) : null}

                <button
                  type="button"
                  onClick={() => setTrainingScheduleExpanded(!trainingScheduleExpanded)}
                  className="w-full flex items-center justify-between p-2 -m-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <Label className="text-base font-medium cursor-pointer">Enter sessions by day</Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Review and edit class times below, or enter them manually.
                    </p>
                  </div>
                  {trainingScheduleExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 ml-4" />
                  )}
                </button>
                
                {trainingScheduleExpanded && (
                  <div className="mt-4 space-y-3 max-w-3xl">
                    {DAYS_OF_WEEK.map(day => {
                      const sessions = trainingSchedule[day] || []
                      const isDayExpanded = expandedDays[day]
                      const sessionCount = sessions.filter(s => s.time.trim() !== '').length
                      
                      return (
                        <div key={day} className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedDays({ ...expandedDays, [day]: !isDayExpanded })}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isDayExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                              <Label className="capitalize text-sm font-semibold text-gray-900 cursor-pointer">
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </Label>
                              {sessionCount > 0 && (
                                <span className="text-xs text-gray-500">
                                  ({sessionCount} {sessionCount === 1 ? 'session' : 'sessions'})
                                </span>
                              )}
                            </div>
                            {!isDayExpanded && sessionCount === 0 && (
                              <span className="text-xs text-gray-400 italic">No sessions</span>
                            )}
                          </button>
                          
                          {isDayExpanded && (
                            <div className="p-4 pt-0 space-y-3">
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setTrainingSchedule({
                                      ...trainingSchedule,
                                      [day]: [...sessions, { time: '', type: '' }]
                                    })
                                  }}
                                  className="text-xs"
                                >
                                  + Add Session
                                </Button>
                              </div>
                              
                              {sessions.length === 0 ? (
                                <p className="text-xs text-gray-500 italic text-center py-2">No training sessions scheduled</p>
                              ) : (
                                <div className="space-y-2">
                                  {sessions.map((session, sessionIndex) => (
                                    <div key={sessionIndex} className="flex gap-2 items-start bg-white p-3 rounded border border-gray-200">
                                      <div className="flex-1 grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                          <Label className="text-xs text-gray-600">Time</Label>
                                          <Input
                                            value={session.time}
                                            onChange={(e) => {
                                              const updated = [...sessions]
                                              updated[sessionIndex] = { ...session, time: e.target.value }
                                              setTrainingSchedule({ ...trainingSchedule, [day]: updated })
                                            }}
                                            placeholder="e.g., 6:00-8:00"
                                            className="text-sm"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs text-gray-600">Type (optional)</Label>
                                          <Input
                                            value={session.type || ''}
                                            onChange={(e) => {
                                              const updated = [...sessions]
                                              updated[sessionIndex] = { ...session, type: e.target.value }
                                              setTrainingSchedule({ ...trainingSchedule, [day]: updated })
                                            }}
                                            placeholder="e.g., Morning, Evening, Sparring"
                                            className="text-sm"
                                          />
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const updated = sessions.filter((_, i) => i !== sessionIndex)
                                          setTrainingSchedule({ ...trainingSchedule, [day]: updated })
                                        }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

          </GymEditPanel>
          ) : null}

          {activeSection === 'trainers' ? (
          <GymEditPanel>
              <div className="flex items-center justify-between">
                <Label>Trainers (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTrainer}>
                  + Add Trainer
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Trainer photos upload in the background — save anytime.
              </p>
              {trainers.map((trainer) => {
                const photo = trainerPhotoDisplay(trainer)
                return (
                <div key={trainer.clientKey} className="max-w-4xl space-y-3 rounded-xl border border-gray-200/90 bg-gray-50/80 p-4">
                  <div className="grid md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Trainer name"
                      value={trainer.name}
                      onChange={(e) => updateTrainer(trainer.clientKey, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Discipline"
                      value={trainer.discipline}
                      onChange={(e) => updateTrainer(trainer.clientKey, 'discipline', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Experience (e.g., 10 years)"
                        value={trainer.experience}
                        onChange={(e) => updateTrainer(trainer.clientKey, 'experience', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTrainer(trainer.clientKey)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-[10rem_1fr] gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Photo (optional)</Label>
                      <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
                        {photo.src ? (
                          <img
                            src={photo.src}
                            alt={trainer.name ? `${trainer.name} photo` : 'Trainer photo'}
                            className="h-28 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-28 items-center justify-center text-xs text-gray-400">
                            No photo
                          </div>
                        )}
                        {photo.failed ? (
                          <span className="absolute inset-x-0 bottom-0 bg-red-600/90 py-0.5 text-center text-[9px] font-semibold uppercase text-white">
                            Upload failed
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null
                            setTrainerPhotoFile(trainer.clientKey, f)
                            e.target.value = ''
                          }}
                        />
                        {photo.src ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTrainerPhotoFile(trainer.clientKey, null)
                              updateTrainer(trainer.clientKey, 'photo_url', '')
                            }}
                          >
                            Clear
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Description (optional)</Label>
                      <Textarea
                        placeholder="Short bio, specialties, titles, notable fights, coaching style…"
                        value={trainer.description || ''}
                        onChange={(e) => updateTrainer(trainer.clientKey, 'description', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )})}
          </GymEditPanel>
          ) : null}
        </form>
        ) : null}

        {activeSection === 'packages' && gym && gym.id ? (
          <GymEditPanel contentClassName="space-y-0">
            <PackagesSection
              gymId={gym.id}
              currency={normalizeGymCurrency(selectedCurrencyCode || gym.currency, 'USD')}
              isAdmin={profile?.role === 'admin'}
              listRefreshKey={packagesListRefreshKey}
              onEditPackage={(pkg) => openPackageEditor({ kind: 'edit', package: pkg })}
              onCreatePackage={() => openPackageEditor({ kind: 'create' })}
            />
          </GymEditPanel>
        ) : null}

        {profile?.role === 'admin' && gym?.id && gym.name ? (
          <AdminDeleteGymSection gymId={gym.id} gymName={gym.name} />
        ) : null}

        <Dialog
              open={focusModal.open}
              onOpenChange={(open) => {
                if (!open) {
                  setFocusModal((p) => ({ ...p, open: false, saving: false, error: null }))
                }
              }}
              stackClassName="z-[140]"
            >
              <DialogContent className="max-w-xl">
                <DialogHeader className="space-y-2">
                  <DialogTitle>Adjust photo focal point</DialogTitle>
                  <DialogDescription>
                    Drag inside the frame to choose what stays in view when this photo is cropped.
                  </DialogDescription>
                </DialogHeader>

                {focusModal.imageUrl ? (
                  <div className="space-y-3">
                    <div
                      ref={focusFrameRef}
                      className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-black"
                      style={{ aspectRatio: '16 / 9' }}
                      onPointerDown={(e) => {
                        focusDraggingRef.current = true
                        ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
                        setFocusFromClientPoint(e.clientX, e.clientY)
                      }}
                      onPointerMove={(e) => {
                        if (!focusDraggingRef.current) return
                        setFocusFromClientPoint(e.clientX, e.clientY)
                      }}
                      onPointerUp={(e) => {
                        focusDraggingRef.current = false
                        try {
                          ;(e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId)
                        } catch {}
                      }}
                      onPointerCancel={() => {
                        focusDraggingRef.current = false
                      }}
                    >
                      <img
                        src={focusModal.imageUrl}
                        alt="Adjust focal point"
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{
                          objectPosition: `${Math.round(focusModal.focusX * 100)}% ${Math.round(focusModal.focusY * 100)}%`,
                        }}
                      />
                      <div
                        className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-white/30 shadow active:cursor-grabbing"
                        style={{
                          left: `${focusModal.focusX * 100}%`,
                          top: `${focusModal.focusY * 100}%`,
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation()
                          focusDraggingRef.current = true
                          setFocusFromClientPoint(e.clientX, e.clientY)
                        }}
                        aria-hidden
                      />
                    </div>

                    {focusModal.error ? (
                      <p className="text-sm text-destructive">{focusModal.error}</p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Tip: drag the dot (or drag anywhere in the photo) to set the focus.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFocusModal((p) => ({ ...p, focusX: 0.5, focusY: 0.5 }))}
                        disabled={focusModal.saving}
                      >
                        Reset to center
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFocusModal((p) => ({ ...p, open: false }))}
                        disabled={focusModal.saving}
                      >
                        Close
                      </Button>
                      <Button type="button" onClick={() => void saveFocusAdjust()} disabled={focusModal.saving}>
                        {focusModal.saving ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No image selected.</p>
                )}
              </DialogContent>
            </Dialog>
    </GymEditLayout>
  )
}

export default function EditGymPage() {
  return (
    <Suspense fallback={
      <div className="min-h-0 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-4">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="border border-gray-300 rounded-lg p-8 bg-white space-y-4">
              <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    }>
      <EditGymForm />
    </Suspense>
  )
}
