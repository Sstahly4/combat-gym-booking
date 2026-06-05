'use client'

import { useEffect, useState, Suspense, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Gym, GymImage } from '@/lib/types/database'
import { PackagesSection } from '@/components/manage/packages-section'
import { GymEditSectionTabs } from '@/components/manage/gym-edit-sidebar'
import { ManageBreadcrumbs } from '@/components/manage/manage-breadcrumbs'
import { ArrowLeft, Info, ChevronDown, ChevronUp, Search, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { ALL_GYM_COUNTRIES } from '@/lib/constants/gym-countries'
import {
  DEFAULT_GYM_AMENITIES,
  GYM_AMENITY_ORDER,
  labelGymAmenity,
  mergeGymAmenitiesFromDb,
} from '@/lib/constants/gym-amenities'
import { AdminDeleteGymSection } from '@/components/admin/admin-delete-gym-section'
import { GymLocationAddressSearch } from '@/components/manage/gym-location-address-search'
import { hasNonLatinChars } from '@/lib/geo/nominatim-address'
import {
  manageGymEditHubBreadcrumb,
  resolvePostGymEditReturnPath,
} from '@/lib/navigation/manage-gym-edit-return'
import { uploadGymImageWithVariants } from '@/lib/images/gym-image-variants'
import { dispatchVerificationMilestone } from '@/lib/manage/verification-milestone-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ResponsiveGymImage } from '@/components/responsive-gym-image'

const DISCIPLINES = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']
const CURRENCIES = ['USD', 'THB', 'AUD', 'IDR']
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

type PendingGymImageStatus = 'queued' | 'uploading' | 'saving' | 'done' | 'failed' | 'cancelled'
type PendingGymImage = {
  id: string
  file: File
  previewUrl: string
  status: PendingGymImageStatus
  error?: string | null
}

interface GymWithImages extends Gym {
  images: GymImage[]
  opening_hours?: any
  trainers?: any
  faq?: any
}

function EditGymForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gymId = searchParams.get('id')
  const sectionFromUrl = searchParams.get('section')
  const returnToRaw = searchParams.get('returnTo')
  const afterEditPath = useMemo(() => resolvePostGymEditReturnPath(returnToRaw), [returnToRaw])
  const hubCrumb = useMemo(() => manageGymEditHubBreadcrumb(afterEditPath), [afterEditPath])

  const { user, profile, loading: authLoading } = useAuth()
  const [gym, setGym] = useState<GymWithImages | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('basic')
  const scrolledToSectionKey = useRef<string | null>(null)
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false)

  // Form State
  const [tagline, setTagline] = useState('')
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [amenities, setAmenities] = useState<Record<string, boolean>>(() => ({
    ...DEFAULT_GYM_AMENITIES,
  }))
  const [newImages, setNewImages] = useState<PendingGymImage[]>([])
  const newImagesRef = useRef<PendingGymImage[]>([])
  newImagesRef.current = newImages
  const cancelImageUploadsRef = useRef(false)
  const [imageUploadSummary, setImageUploadSummary] = useState<{
    active: boolean
    completed: number
    failed: number
    total: number
  }>({ active: false, completed: 0, failed: 0, total: 0 })

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
  const [imageDragEnabled, setImageDragEnabled] = useState(false)
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
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
  const [countrySearch, setCountrySearch] = useState('')
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>('')
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
  const [trainers, setTrainers] = useState<
    Array<{
      name: string
      discipline: string
      experience: string
      photo_url?: string | null
      description?: string
    }>
  >([])
  const [trainerPhotoFiles, setTrainerPhotoFiles] = useState<Record<number, File | null>>({})
  const [trainerPhotoPreviews, setTrainerPhotoPreviews] = useState<Record<number, string | null>>({})
  const [faq, setFaq] = useState<Array<{ question: string; answer: string }>>([])

  // Get cache key for this gym
  const getCacheKey = () => gymId ? `gym_edit_${gymId}` : null

  // Save form state to localStorage
  const saveFormState = () => {
    const cacheKey = getCacheKey()
    if (!cacheKey) return

    try {
      const formState = {
        disciplines,
        amenities,
        selectedCountry,
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
  const restoreFormState = (): { hasCachedState: boolean; restoredLocationFromCache: boolean } => {
    const cacheKey = getCacheKey()
    if (!cacheKey) return { hasCachedState: false, restoredLocationFromCache: false }

    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return { hasCachedState: false, restoredLocationFromCache: false }

      const formState = JSON.parse(cached)

      // Only restore if cache is less than 24 hours old
      const cacheAge = Date.now() - (formState.timestamp || 0)
      if (cacheAge > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(cacheKey)
        return { hasCachedState: false, restoredLocationFromCache: false }
      }

      // Restore form state
      if (formState.disciplines) setDisciplines(formState.disciplines)
      if (formState.amenities) setAmenities(mergeGymAmenitiesFromDb(formState.amenities))
      if (formState.selectedCountry) setSelectedCountry(formState.selectedCountry)
      if (formState.openingHours) setOpeningHours(formState.openingHours)
      if (formState.trainingSchedule) setTrainingSchedule(formState.trainingSchedule)
      if (formState.trainers) setTrainers(formState.trainers)
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

      return { hasCachedState: true, restoredLocationFromCache }
    } catch (error) {
      console.error('Failed to restore form state from localStorage:', error)
      return { hasCachedState: false, restoredLocationFromCache: false }
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
    disciplines,
    amenities,
    selectedCountry,
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
      // Only warn if there are actual changes (we have cached state)
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
    if (!gym || !sectionFromUrl) return
    const validSectionIds = new Set([
      'basic',
      'location',
      'images',
      'disciplines',
      'schedule',
      'trainers',
      'faq',
      'packages',
    ])
    if (!validSectionIds.has(sectionFromUrl)) return
    const key = `${(gym as { id: string }).id}:${sectionFromUrl}`
    if (scrolledToSectionKey.current === key) return
    scrolledToSectionKey.current = key
    setActiveSection(sectionFromUrl)
    const t = window.setTimeout(() => {
      document.getElementById(`section-${sectionFromUrl}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
    return () => window.clearTimeout(t)
  }, [gym, sectionFromUrl])

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const sync = () => setImageDragEnabled(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    return () => {
      newImagesRef.current.forEach((entry) => URL.revokeObjectURL(entry.previewUrl))
    }
  }, [])

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

    // Try to restore cached form state first
    const { hasCachedState, restoredLocationFromCache } = restoreFormState()

    if (!restoredLocationFromCache) {
      setLocationAddress(data.address || '')
      const loadedCity = data.city || ''
      setLocationCity(loadedCity)
      if (hasNonLatinChars(loadedCity)) setCityNonLatinWarning(true)
      setLocationLat(
        data.latitude != null && !Number.isNaN(Number(data.latitude)) ? String(data.latitude) : ''
      )
      setLocationLng(
        data.longitude != null && !Number.isNaN(Number(data.longitude)) ? String(data.longitude) : ''
      )
    }

    // tagline is always loaded fresh from DB (not cached)
    setTagline((data as { tagline?: string | null }).tagline || '')

    // If no cached state, use data from database
    if (!hasCachedState) {
      setSelectedCountry(data.country || '')
      setDisciplines(data.disciplines || [])
    }
    
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
          DAYS_OF_WEEK.forEach(day => {
            if (schedule[day]) {
              if (typeof schedule[day] === 'string') {
                // Old format: convert string to array
                converted[day] = [{ time: schedule[day] }]
              } else if (Array.isArray(schedule[day])) {
                // New format: already array - create a new mutable array copy to avoid readonly issues
                converted[day] = Array.from(schedule[day]).map(session => ({ 
                  time: session.time || '', 
                  type: session.type || '' 
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
          DAYS_OF_WEEK.forEach(day => {
            empty[day] = []
          })
          setTrainingSchedule(empty)
        }
      }
      if (data.trainers && Array.isArray(data.trainers)) {
        setTrainers(data.trainers)
      }
      if (data.faq && Array.isArray(data.faq)) {
        setFaq(data.faq)
      }
    }
    
    setLoading(false)
  }

  const handleDisciplineToggle = (discipline: string) => {
    setDisciplines(prev => 
      prev.includes(discipline)
        ? prev.filter(d => d !== discipline)
        : [...prev, discipline]
    )
  }

  const handleAmenityChange = (key: string, checked: boolean) => {
    setAmenities(prev => {
      const updated = { ...prev, [key]: checked }
      console.log('Amenity changed:', key, checked, 'Total selected:', Object.values(updated).filter(v => v === true).length)
      return updated
    })
  }
  
  const orderedAmenityEntries: [string, boolean][] = GYM_AMENITY_ORDER.map((key) => [
    key,
    amenities[key] ?? false,
  ])

  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const files = Array.from(e.target.files)
    setNewImages((prev) => {
      const currentCount = (gym?.images?.length || 0) + prev.length
      const remainingSlots = 30 - currentCount
      if (remainingSlots <= 0) {
        alert('Maximum 30 images allowed')
        return prev
      }
      const toAdd = files.slice(0, remainingSlots).map((file, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 10)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'queued' as const,
        error: null,
      }))
      return [...prev, ...toAdd]
    })
    e.target.value = ''
  }

  const removeNewImage = (index: number) => {
    setNewImages((prev) => {
      const entry = prev[index]
      if (entry) URL.revokeObjectURL(entry.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
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
    } else {
      fetchGym(gym!.id)
    }
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

  const uploadNewImages = async (
    gymId: string,
    pending: PendingGymImage[],
    existingImages: GymImage[],
  ): Promise<GymImage[]> => {
    if (pending.length === 0) return []

    const supabase = createClient()
    const existingSafe = existingImages || []
    const maxOrder =
      existingSafe.length > 0
        ? Math.max(...existingSafe.map((img: GymImage) => img.order || 0))
        : -1

    const createMutableCopy = (obj: any): any => {
      if (typeof structuredClone !== 'undefined') return structuredClone(obj)
      return JSON.parse(JSON.stringify(obj))
    }

    cancelImageUploadsRef.current = false
    setImageUploadSummary({ active: true, completed: 0, failed: 0, total: pending.length })

    const successful: Array<{
      gym_id: string
      url: string
      variants: Record<string, string>
      order: number
      storagePaths: string[]
      pendingId: string
    }> = []

    for (let index = 0; index < pending.length; index++) {
      const entry = pending[index]!
      if (cancelImageUploadsRef.current) {
        setNewImages((prev) =>
          prev.map((x) => (x.id === entry.id && x.status !== 'done' ? { ...x, status: 'cancelled' } : x)),
        )
        continue
      }

      setNewImages((prev) => prev.map((x) => (x.id === entry.id ? { ...x, status: 'uploading', error: null } : x)))
      try {
        const stem = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}`
        const uploaded = await uploadGymImageWithVariants({ supabase, gymId, file: entry.file, stem })
        successful.push({
          gym_id: gymId,
          url: uploaded.url,
          variants: uploaded.variants,
          order: maxOrder + index + 1,
          storagePaths: uploaded.storagePaths,
          pendingId: entry.id,
        })
        setImageUploadSummary((s) => ({ ...s, completed: s.completed + 1 }))
        setNewImages((prev) => prev.map((x) => (x.id === entry.id ? { ...x, status: 'saving' } : x)))
      } catch (e: any) {
        const errorMessage = e?.message || e?.toString() || 'Upload failed'
        setImageUploadSummary((s) => ({ ...s, failed: s.failed + 1 }))
        setNewImages((prev) =>
          prev.map((x) => (x.id === entry.id ? { ...x, status: 'failed', error: errorMessage } : x)),
        )
      }
    }

    const validImageData = successful.map(({ storagePaths: _sp, pendingId: _pid, ...row }) => row)
    const uploadedFiles = successful.flatMap((s) => s.storagePaths)

    if (validImageData.length === 0) {
      setImageUploadSummary((s) => ({ ...s, active: false }))
      throw new Error('All image uploads failed. Please try again or upload fewer images at a time.')
    }

    // Save DB records for all successful uploads.
    const { data: insertedImages, error: insertError } = await supabase
      .from('gym_images')
      .insert(validImageData)
      .select()

    if (insertError) {
      console.error('Database insert error:', insertError)
      await supabase.storage.from('gym-images').remove(uploadedFiles)
      setImageUploadSummary((s) => ({ ...s, active: false }))
      throw new Error(`Failed to save image records: ${insertError.message}`)
    }

    // Mark successful pending entries as done + revoke previews.
    const successfulIds = new Set(successful.map((s) => s.pendingId))
    setNewImages((prev) => {
      prev.forEach((x) => {
        if (successfulIds.has(x.id)) URL.revokeObjectURL(x.previewUrl)
      })
      return prev.filter((x) => !successfulIds.has(x.id))
    })

    if (insertedImages && insertedImages.length > 0) {
      setGym((prev) => {
        if (!prev || prev.id !== gymId) return prev
        const updatedImages = [...(prev.images || []), ...insertedImages].sort(
          (a, b) => (a.order || 0) - (b.order || 0),
        )
        return { ...createMutableCopy(prev), images: updatedImages }
      })
    }

    setImageUploadSummary((s) => ({ ...s, active: false }))

    return insertedImages || []
  }

  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedImageIndex === null || !gym) return

    const images = [...gym.images]
    const draggedImage = images[draggedImageIndex]
    
    images.splice(draggedImageIndex, 1)
    images.splice(dropIndex, 0, draggedImage)
    
    const updatedImages = images.map((img, index) => ({
      ...img,
      order: index
    }))

    // Update state immediately for UI feedback
    // Create a new mutable object to avoid readonly property errors
    const createMutableCopy = (obj: any): any => {
      if (typeof structuredClone !== 'undefined') {
        return structuredClone(obj)
      }
      return JSON.parse(JSON.stringify(obj))
    }
    setGym({
      ...createMutableCopy(gym),
      images: updatedImages
    })

    // Save to database
    const supabase = createClient()
    const updatePromises = updatedImages.map((img) =>
      supabase
        .from('gym_images')
        .update({ order: img.order })
        .eq('id', img.id)
    )

    const results = await Promise.allSettled(updatePromises)
    const failed = results.filter(r => r.status === 'rejected')
    
    if (failed.length > 0) {
      console.error('Failed to update image order:', failed)
      alert('Some image order updates failed. Please try again.')
      // Reload gym data to restore correct order
      if (gymId) {
        await fetchGym(gymId)
      }
    }
    
    setDraggedImageIndex(null)
  }

  const addTrainer = () => {
    setTrainers([...trainers, { name: '', discipline: '', experience: '', photo_url: null, description: '' }])
  }

  const removeTrainer = (index: number) => {
    setTrainers(trainers.filter((_, i) => i !== index))
    setTrainerPhotoFiles((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    setTrainerPhotoPreviews((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  const updateTrainer = (index: number, field: string, value: string) => {
    const updated = [...trainers]
    updated[index] = { ...updated[index], [field]: value }
    setTrainers(updated)
  }

  const setTrainerPhotoFile = (index: number, file: File | null) => {
    setTrainerPhotoFiles((prev) => ({ ...prev, [index]: file }))
    setTrainerPhotoPreviews((prev) => {
      const next = { ...prev }
      if (next[index]) URL.revokeObjectURL(next[index]!)
      return { ...next, [index]: file ? URL.createObjectURL(file) : null }
    })
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
      setErrorMsg('Form not found')
      return
    }

    saveInProgressRef.current = true
    setSaving(true)
    setErrorMsg(null)
    const supabase = createClient()
    const formData = new FormData(formElement)

    let pendingImagesSnapshot: PendingGymImage[] = []

    try {
      // Upload trainer photos (optional) before saving gym JSONB.
      // Use unique keys and avoid upsert to keep Storage RLS requirements minimal.
      const trainersWithUploadedPhotos = await (async () => {
        if (!gym?.id) return [...trainers]
        const out = [...trainers]
        for (let i = 0; i < out.length; i++) {
          const file = trainerPhotoFiles[i]
          if (!file) continue
          try {
            const ext = file.name.split('.').pop() || 'jpg'
            const safeExt = ext.length <= 10 ? ext : 'jpg'
            const fileName = `trainers/${gym.id}/${Date.now()}-${i}.${safeExt}`
            const { error: uploadError } = await supabase.storage
              .from('gym-images')
              .upload(fileName, file, { cacheControl: '3600', upsert: false })
            if (uploadError) throw uploadError
            const { data: urlData } = supabase.storage.from('gym-images').getPublicUrl(fileName)
            out[i] = { ...out[i], photo_url: urlData.publicUrl }
          } catch (err: any) {
            console.error('Failed to upload trainer photo:', err)
            throw new Error(`Failed to upload trainer photo (${out[i]?.name || `Trainer ${i + 1}`}): ${err?.message || 'Unknown error'}`)
          }
        }
        return out
      })()

      const updates = {
        name: formData.get('name') as string,
        tagline: tagline.trim() || null,
        description: formData.get('description') as string,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        country: selectedCountry,
        latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null,
        longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null,
        price_per_day: parseFloat(formData.get('price_per_day') as string),
        price_per_week: formData.get('price_per_week') ? parseFloat(formData.get('price_per_week') as string) : null,
        currency: formData.get('currency') as string,
        disciplines: [...disciplines], // Create new array to avoid readonly issues
        amenities: mergeGymAmenitiesFromDb(amenities),
        google_maps_link: formData.get('google_maps_link') as string || null,
        instagram_link: formData.get('instagram_link') as string || null,
        facebook_link: formData.get('facebook_link') as string || null,
        opening_hours: { ...openingHours }, // Create new object to avoid readonly issues
        training_schedule: Object.fromEntries(
          Object.entries(trainingSchedule).map(([day, sessions]) => [
            day,
            [...sessions].filter(s => s.time.trim() !== '') // Create new array and filter
          ])
        ),
        trainers: [...trainersWithUploadedPhotos]
          .map((t) => ({
            name: t.name,
            discipline: t.discipline,
            experience: t.experience,
            photo_url: t.photo_url ?? null,
            description: (t.description ?? '').trim() || null,
          }))
          .filter((t) => t.name && t.discipline),
        faq: [...faq].filter(f => f.question && f.answer), // Create new array
      }

      pendingImagesSnapshot = [...newImages]

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

      // Sync tagline state with what was saved so the field shows the persisted value.
      setTagline((updates as { tagline?: string | null }).tagline || '')

      // Clear any pending local photo files after a successful save.
      setTrainerPhotoFiles({})
      setTrainerPhotoPreviews((prev) => {
        Object.values(prev).forEach((u) => {
          if (u) URL.revokeObjectURL(u)
        })
        return {}
      })
      
      // Upload new images before redirecting
      const queued = pendingImagesSnapshot.filter((x) => x.status === 'queued' || x.status === 'failed')
      if (queued.length > 0) {
        try {
          await uploadNewImages(gym.id, queued, gym.images || [])
        } catch (uploadError: any) {
          console.error('Image upload error:', uploadError)
          throw new Error(`Failed to upload images: ${uploadError.message}`)
        }
      }

      // Persist order for existing rows only (skip right after inserts — avoids stale `gym.images`)
      if (pendingImagesSnapshot.length === 0 && gym.images && gym.images.length > 0) {
        const supabase = createClient()
        // Create a mutable copy of images array to avoid readonly errors
        const imagesCopy = [...gym.images]
        const orderUpdates = imagesCopy.map((img, index) => ({
          id: img.id,
          order: index
        }))

        const updatePromises = orderUpdates.map(({ id, order }) =>
          supabase
            .from('gym_images')
            .update({ order })
            .eq('id', id)
        )

        const results = await Promise.allSettled(updatePromises)
        const failed = results.filter(r => r.status === 'rejected')
        
        if (failed.length > 0) {
          console.error('Failed to update some image orders:', failed)
          // Don't throw - allow save to complete, just log the error
        }
      }

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
      if (pendingImagesSnapshot.length > 0) {
        setNewImages(pendingImagesSnapshot)
      }
      console.error('Error updating gym:', err)
      setErrorMsg(`Update failed: ${err.message}`)
    } finally {
      saveInProgressRef.current = false
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="border border-gray-300 rounded-lg p-8 bg-white space-y-6">
            <div className="space-y-4">
              <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-white py-8">
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

  // Calculate section completion status
  const sectionStatus = {
    basic: { completed: !!(gym.name && gym.description && gym.price_per_day), required: true },
    location: { completed: !!(locationAddress && locationCity && selectedCountry), required: true },
    images: { completed: !!(gym.images && gym.images.length > 0), required: true },
    disciplines: { completed: disciplines.length > 0, required: true },
    schedule: { completed: false, required: false },
    trainers: { completed: trainers.length > 0, required: false },
    faq: { completed: faq.length > 0, required: false },
    packages: { completed: false, required: true },
  }

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const element = document.getElementById(`section-${sectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-full bg-gray-50">
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href={afterEditPath} className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-lg font-bold text-gray-900 truncate">Edit gym</h1>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:py-8 md:pb-10">
        <div className="hidden md:block mb-6">
          <ManageBreadcrumbs
            items={[{ label: hubCrumb.label, href: hubCrumb.href }, { label: 'Edit gym' }]}
          />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit gym profile</h1>
          <p className="text-gray-600 text-sm mt-1">Update your listing — changes sync to your preview and public page.</p>
        </div>

        {/* Section chips: tablet+ only — mobile is one scroll; avoids crowding + duplicate "steps" UX */}
        <div className="hidden md:block">
          <GymEditSectionTabs
            activeSection={activeSection}
            onSectionChange={scrollToSection}
            sections={sectionStatus}
          />
        </div>

        <form id="edit-gym-form" onSubmit={handleSave} className="space-y-6">
          {/* Basic Information */}
          <Card id="section-basic" className="scroll-mt-24 md:scroll-mt-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell us about your gym</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Gym Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={gym.name} 
                  required 
                  className="max-w-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">
                  Listing tagline
                  <span className="ml-1.5 text-xs font-normal text-gray-400">(shown on search cards)</span>
                </Label>
                <input
                  id="tagline"
                  name="tagline"
                  type="text"
                  maxLength={80}
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="flex h-10 w-full max-w-2xl rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="e.g. Beachside Muay Thai in the heart of Krabi"
                />
                <p className="text-xs text-gray-400 tabular-nums">{tagline.length}/80</p>
                <p className="text-xs text-gray-500">
                  One line, max 60–80 characters. This is the first thing guests read under your gym name on
                  mobile search. Write it like a headline: location, vibe, what makes you different.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={gym.description || ''} 
                  required 
                  rows={6}
                  className="max-w-4xl"
                  placeholder="Describe your gym, training philosophy, facilities, and what makes it special..."
                />
                <p className="text-xs text-gray-500">
                  Full description shown on your gym profile page.
                </p>
              </div>

              {/* Base Pricing - Moved here from separate section */}
              <div className="pt-6 border-t space-y-4">
                <div>
                  <Label className="text-base font-semibold">Search listing price</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    This is the price visitors see in search results and the homepage. Set it to match your lowest package price — it updates automatically when you save packages.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4 max-w-3xl">
                  <div className="space-y-2">
                    <Label htmlFor="price_per_day">Search listing price (per day) <span className="text-red-500">*</span></Label>
                    <Input 
                      id="price_per_day" 
                      name="price_per_day" 
                      type="number" 
                      step="0.01" 
                      defaultValue={gym.price_per_day} 
                      required 
                    />
                    <p className="text-xs text-gray-500">Shown in search results and "Starting from" price displays</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_per_week">Base Price per Week (optional)</Label>
                    <Input 
                      id="price_per_week" 
                      name="price_per_week" 
                      type="number" 
                      step="0.01" 
                      defaultValue={gym.price_per_week || ''} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency <span className="text-red-500">*</span></Label>
                    <Select name="currency" defaultValue={gym.currency} required>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Verification */}
          <Card id="section-location" className="scroll-mt-24 md:scroll-mt-6">
            <CardHeader>
              <CardTitle>Location & Verification</CardTitle>
              <CardDescription>Help customers find and verify your gym</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <GymLocationAddressSearch
                  disabled={saving}
                  onApply={({ address, city, latitude, longitude, country }) => {
                    setLocationAddress(address)
                    setLocationCity(city)
                    setCityNonLatinWarning(hasNonLatinChars(city))
                    setLocationLat(latitude)
                    setLocationLng(longitude)
                    if (country) setSelectedCountry(country)
                  }}
                />

                <Label htmlFor="address">Full Address <span className="text-red-500">*</span></Label>
                <Input
                  id="address"
                  name="address"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="e.g., 123 Soi Bang Tao, Bangtao Beach, Phuket 83110, Thailand"
                  required
                />
                <p className="text-xs text-gray-500">
                  Include street number, street name, and postcode. Use search above to normalize spelling, or paste
                  from Google Maps.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                  <Input
                    id="city"
                    name="city"
                    value={locationCity}
                    onChange={(e) => {
                      setLocationCity(e.target.value)
                      if (cityNonLatinWarning) {
                        setCityNonLatinWarning(hasNonLatinChars(e.target.value))
                      }
                    }}
                    onBlur={(e) => setCityNonLatinWarning(hasNonLatinChars(e.target.value))}
                    required
                    title="Prefilled from map search; edit if you prefer a different area name for guests"
                  />
                  <p className="text-xs text-gray-500">
                    Prefilled from map search. You can change it if the map label is too local for how you list this
                    gym.
                  </p>
                  {cityNonLatinWarning && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                      ⚠️ Your city name may not appear in search results for international guests. Please use the
                      English or Latin spelling — e.g. &quot;Koh Phangan&quot;, &quot;Tokyo&quot;,
                      &quot;Bangkok&quot;.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="country"
                        type="text"
                        value={countryDropdownOpen ? countrySearch : selectedCountry}
                        onChange={(e) => {
                          setCountrySearch(e.target.value)
                          setCountryDropdownOpen(true)
                        }}
                        onFocus={() => {
                          setCountryDropdownOpen(true)
                          if (selectedCountry) {
                            setCountrySearch(selectedCountry)
                          }
                        }}
                        placeholder={selectedCountry ? "" : "Search for a country..."}
                        className="pl-10 pr-10"
                        required
                      />
                      {selectedCountry && !countryDropdownOpen && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCountry('')
                            setCountrySearch('')
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {countryDropdownOpen && countrySearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setCountrySearch('')
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {countryDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setCountryDropdownOpen(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                          <div className="overflow-y-auto max-h-60">
                            {ALL_GYM_COUNTRIES
                              .filter(country =>
                                country.toLowerCase().includes(countrySearch.toLowerCase())
                              )
                              .map(country => (
                                <button
                                  key={country}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountry(country)
                                    setCountrySearch('')
                                    setCountryDropdownOpen(false)
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                                    selectedCountry === country ? 'bg-blue-50 text-[#003580] font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  {country}
                                </button>
                              ))}
                            {ALL_GYM_COUNTRIES.filter(country =>
                              country.toLowerCase().includes(countrySearch.toLowerCase())
                            ).length === 0 && (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                No countries found
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <input type="hidden" name="country" value={selectedCountry} required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude (optional)</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={locationLat}
                    onChange={(e) => setLocationLat(e.target.value)}
                    placeholder="e.g., 7.8804"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude (optional)</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={locationLng}
                    onChange={(e) => setLocationLng(e.target.value)}
                    placeholder="e.g., 98.3923"
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                {profile?.role !== 'admin' && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Verification Links Required</p>
                      <p className="text-blue-700">These links are required for gym verification. Make sure they match your gym's address and are publicly accessible.</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="google_maps_link">
                    Google Maps Listing Link {profile?.role !== 'admin' && <span className="text-red-500">*</span>}
                  </Label>
                  <Input 
                    id="google_maps_link" 
                    name="google_maps_link" 
                    type="url"
                    defaultValue={(gym as any).google_maps_link || ''} 
                    placeholder="https://maps.google.com/..."
                    required={profile?.role !== 'admin'} 
                  />
                  <p className="text-xs text-gray-500">
                    Link to your gym's Google Maps listing. This must match your address above.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                  <div className="space-y-2">
                    <Label htmlFor="instagram_link">
                      Instagram Link {profile?.role !== 'admin' && <span className="text-red-500">*</span>}
                    </Label>
                    <Input 
                      id="instagram_link" 
                      name="instagram_link" 
                      type="url"
                      defaultValue={(gym as any).instagram_link || ''} 
                      placeholder="https://instagram.com/yourgym"
                      required={profile?.role !== 'admin'} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook_link">Facebook Link (optional)</Label>
                    <Input 
                      id="facebook_link" 
                      name="facebook_link" 
                      type="url"
                      defaultValue={(gym as any).facebook_link || ''} 
                      placeholder="https://facebook.com/yourgym"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disciplines & Amenities */}
          <Card id="section-disciplines" className="scroll-mt-24 md:scroll-mt-6">
            <CardHeader>
              <CardTitle>Disciplines & Amenities</CardTitle>
              <CardDescription>What do you offer?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Disciplines Offered <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DISCIPLINES.map(d => (
                    <label 
                      key={d} 
                      className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-[#003580] hover:bg-blue-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={disciplines.includes(d)}
                        onChange={() => handleDisciplineToggle(d)}
                        className="rounded w-4 h-4 text-[#003580] focus:ring-[#003580]"
                      />
                      <span className="text-sm font-medium">{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Amenities</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Training gear, classes, and facility details tailored for combat sports—pick everything that applies.
                    </p>
                  </div>
                  {orderedAmenityEntries.length > 12 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAmenitiesExpanded(!amenitiesExpanded)}
                      className="text-xs text-[#003580] hover:text-[#003580]/80"
                    >
                      {amenitiesExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1 inline" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1 inline" />
                          Show More ({orderedAmenityEntries.length - 12} more)
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                  {orderedAmenityEntries
                    .slice(0, amenitiesExpanded ? orderedAmenityEntries.length : 12)
                    .map(([key, value]) => (
                    <label 
                      key={key} 
                      className={`flex items-start gap-2.5 cursor-pointer p-2.5 rounded-md border transition-colors ${
                        value 
                          ? 'border-[#003580] bg-blue-50 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleAmenityChange(key, e.target.checked)}
                        className="rounded w-4 h-4 text-[#003580] focus:ring-2 focus:ring-[#003580] focus:ring-offset-1 cursor-pointer flex-shrink-0 mt-0.5"
                      />
                      <span className="text-sm text-gray-700 leading-tight select-none flex-1">
                        {labelGymAmenity(key)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card id="section-images" className="scroll-mt-24 md:scroll-mt-6">
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Upload up to 30 images. The first image is your main photo.
                {imageDragEnabled
                  ? ' Drag photos to reorder.'
                  : ' On desktop you can drag to reorder; on mobile use the × control to remove a photo.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 font-medium">
                    Images ({(gym.images?.length || 0) + newImages.length}/30)
                  </p>
                  <div className="space-y-2 max-w-md">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleNewImageSelect}
                      disabled={(gym.images?.length || 0) + newImages.length >= 30}
                      className="text-sm"
                    />
                  </div>
                </div>

                {imageUploadSummary.active ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">
                        Uploading images… {imageUploadSummary.completed + imageUploadSummary.failed}/
                        {imageUploadSummary.total}
                      </p>
                      <p className="text-amber-900/80">
                        Keep this tab open until uploads finish. You can remove failed images and retry.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 border-amber-200 bg-white text-amber-950 hover:bg-amber-100"
                      onClick={() => {
                        cancelImageUploadsRef.current = true
                      }}
                    >
                      Cancel uploads
                    </Button>
                  </div>
                ) : null}
                
                {(gym.images && gym.images.length > 0) || newImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Existing images */}
                    {gym.images && gym.images.map((img, index) => (
                      <div
                        key={img.id}
                        draggable={imageDragEnabled}
                        onDragStart={imageDragEnabled ? () => handleDragStart(index) : undefined}
                        onDragOver={imageDragEnabled ? (e) => handleDragOver(e, index) : undefined}
                        onDrop={imageDragEnabled ? (e) => handleDrop(e, index) : undefined}
                        className={`relative aspect-video group rounded-lg overflow-hidden border-2 touch-manipulation ${
                          imageDragEnabled ? 'cursor-move' : 'cursor-default'
                        } ${
                          draggedImageIndex === index 
                            ? 'opacity-50 border-[#003580]' 
                            : 'border-gray-200 hover:border-[#003580]'
                        } transition-all`}
                      >
                        <div className="absolute inset-0">
                          <ResponsiveGymImage
                            image={img}
                            alt="Gym"
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium pointer-events-none">
                          #{index + 1}
                        </div>
                        <button
                          type="button"
                          onPointerDown={(ev) => ev.stopPropagation()}
                          onClick={() => deleteExistingImage(img.id)}
                          className="absolute top-1 right-1 z-20 min-h-10 min-w-10 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full text-lg font-bold transition-colors shadow-lg touch-manipulation"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                        <button
                          type="button"
                          onPointerDown={(ev) => ev.stopPropagation()}
                          onClick={() => openFocusAdjust(img)}
                          className="absolute bottom-1 right-1 z-20 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-gray-900 shadow hover:bg-white"
                        >
                          Adjust
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-[#003580] text-white text-xs px-2 py-1 rounded font-medium">
                            Main Photo
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* New images (preview before upload) */}
                    {newImages.map((entry, i) => {
                      const displayIndex = (gym.images?.length || 0) + i
                      const badge =
                        entry.status === 'queued'
                          ? 'Queued'
                          : entry.status === 'uploading'
                            ? 'Uploading…'
                            : entry.status === 'saving'
                              ? 'Saving…'
                              : entry.status === 'failed'
                                ? 'Failed'
                                : entry.status === 'cancelled'
                                  ? 'Cancelled'
                                  : 'New'
                      const badgeClass =
                        entry.status === 'failed'
                          ? 'bg-red-600'
                          : entry.status === 'uploading' || entry.status === 'saving'
                            ? 'bg-amber-600'
                            : entry.status === 'cancelled'
                              ? 'bg-gray-600'
                              : 'bg-blue-600'
                      return (
                        <div
                          key={entry.previewUrl}
                          draggable={false}
                          className="relative aspect-video rounded-lg overflow-hidden border-2 border-blue-300 border-dashed touch-manipulation"
                        >
                          <img 
                            src={entry.previewUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover pointer-events-none" 
                          />
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium pointer-events-none">
                            #{displayIndex + 1} (New)
                          </div>
                          <div className={`absolute top-2 right-2 ${badgeClass} text-white text-[11px] px-2 py-1 rounded font-medium pointer-events-none`}>
                            {badge}
                          </div>
                          <button
                            type="button"
                            onPointerDown={(ev) => ev.stopPropagation()}
                            onClick={() => removeNewImage(i)}
                            className="absolute top-1 right-1 z-20 min-h-10 min-w-10 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full text-lg font-bold transition-colors shadow-lg touch-manipulation"
                            aria-label="Remove pending image"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[11px] px-2 py-1 rounded font-medium">
                            {entry.error ? entry.error : 'Will upload on save'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No images uploaded yet. Upload images above to get started.</p>
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  {imageDragEnabled
                    ? 'Drag existing images to reorder. '
                    : 'Reorder on desktop with drag-and-drop. '}
                  New images are added at the end when you save.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details - Optional but helpful */}
          <Card id="section-schedule" className="scroll-mt-24 md:scroll-mt-6">
            <CardHeader>
              <CardTitle>Additional Details (Optional)</CardTitle>
              <CardDescription>More information helps customers make better decisions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
              <div className="pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setTrainingScheduleExpanded(!trainingScheduleExpanded)}
                  className="w-full flex items-center justify-between p-2 -m-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <Label className="text-base font-medium cursor-pointer">Training Schedule (optional)</Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Add training sessions for each day. You can add multiple sessions per day.
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
                                          <Label className="text-xs text-gray-600">Time <span className="text-red-500">*</span></Label>
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

            </CardContent>
          </Card>

          {/* Trainers */}
          <Card id="section-trainers" className="scroll-mt-24 md:scroll-mt-6">
            <CardHeader>
              <CardTitle>Trainers</CardTitle>
              <CardDescription>List your trainers and their expertise (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Trainers (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTrainer}>
                  + Add Trainer
                </Button>
              </div>
              {trainers.map((trainer, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg max-w-4xl space-y-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Trainer name"
                      value={trainer.name}
                      onChange={(e) => updateTrainer(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Discipline"
                      value={trainer.discipline}
                      onChange={(e) => updateTrainer(index, 'discipline', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Experience (e.g., 10 years)"
                        value={trainer.experience}
                        onChange={(e) => updateTrainer(index, 'experience', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTrainer(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-[10rem_1fr] gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Photo (optional)</Label>
                      <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
                        {trainerPhotoPreviews[index] || trainer.photo_url ? (
                          <img
                            src={(trainerPhotoPreviews[index] as string) || (trainer.photo_url as string)}
                            alt={trainer.name ? `${trainer.name} photo` : 'Trainer photo'}
                            className="h-28 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-28 items-center justify-center text-xs text-gray-400">
                            No photo
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null
                            setTrainerPhotoFile(index, f)
                          }}
                        />
                        {(trainerPhotoPreviews[index] || trainer.photo_url) ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTrainerPhotoFile(index, null)
                              updateTrainer(index, 'photo_url', '')
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
                        onChange={(e) => updateTrainer(index, 'description', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card id="section-faq" className="scroll-mt-24 md:scroll-mt-6">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Add common questions and answers (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Frequently Asked Questions (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                  + Add Question
                </Button>
              </div>
                {faq.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3 max-w-4xl">
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
            </CardContent>
          </Card>
            </form>

            {/* Packages Section - Uses PackageManager with inline variant management */}
            {gym && gym.id && (
              <Card id="section-packages" className="mt-6 scroll-mt-24 md:scroll-mt-6">
                <CardHeader>
                  <CardTitle>Packages & Offers</CardTitle>
                  <CardDescription>
                    Create and manage your training packages. Add room variants directly to packages for accommodation options.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PackagesSection 
                    gymId={gym.id} 
                    currency={gym.currency || 'USD'}
                    isAdmin={profile?.role === 'admin'}
                  />
                </CardContent>
              </Card>
            )}

            {/* Action Buttons - Outside form but can trigger form submission */}
            <div className="mt-6 flex gap-4 border-t pt-6 pb-6 md:pb-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(afterEditPath)}
                className="flex-1 md:flex-initial"
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={async () => {
                  // Call handleSave directly without event
                  await handleSave()
                }}
                disabled={saving}
                className="flex-1 md:flex-initial bg-[#003580] hover:bg-[#003580]/90"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

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
      </main>
    </div>
  )
}

export default function EditGymPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white py-8">
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
