'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GymStepper } from './gym-stepper'
import { AccommodationQuickModal } from './accommodation-quick-modal'
import type { CanonicalOfferType, Package } from '@/lib/types/database'
import { 
  Dumbbell, 
  BedDouble, 
  UtensilsCrossed, 
  Calendar, 
  Eye,
  Check,
  X,
  Plus,
  Trash2,
  Ticket,
  Upload,
  ImageIcon,
  Users,
} from 'lucide-react'

const SPORTS = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing', 'All Sports']
const CURRENCIES = ['USD', 'THB', 'EUR', 'GBP', 'AUD', 'IDR', 'JPY', 'CNY', 'SGD', 'MYR', 'NZD', 'CAD', 'HKD', 'INR', 'KRW', 'PHP', 'VND']

const OFFER_TYPES = [
  {
    id: 'TYPE_TRAINING_ONLY',
    name: 'Training Only',
    description: 'Training sessions only. No accommodation or meals.',
    icon: Dumbbell,
    color: 'blue',
  },
  {
    id: 'TYPE_TRAINING_ACCOM',
    name: 'Training + Accommodation',
    description: 'Training sessions + selectable room. Meals optional.',
    icon: BedDouble,
    color: 'green',
  },
  {
    id: 'TYPE_ALL_INCLUSIVE',
    name: 'All-Inclusive',
    description: 'Training + Room + Meals + Extras. One flat fee bundle.',
    icon: UtensilsCrossed,
    color: 'purple',
  },
  {
    id: 'TYPE_CUSTOM_EXP',
    name: 'Short-term Experience',
    description: 'Specialized camps, prep weeks, or fixed-date experiences.',
    icon: Calendar,
    color: 'orange',
  },
  {
    id: 'TYPE_ONE_TIME_EVENT',
    name: 'One-Time Event',
    description: 'Seminars, workshops, or single events with ticket tiers and a fixed date.',
    icon: Ticket,
    color: 'amber',
  },
] as const


interface OfferStepperProps {
  gymId: string
  currency: string
  onComplete: () => void
  existingPackage?: Package | null
  /** When true, omit full-viewport height and page background — for use inside modals / onboarding cards. */
  embedded?: boolean
}

export function OfferStepper({ gymId, currency, onComplete, existingPackage, embedded = false }: OfferStepperProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  
  // Step 1: Offer Type
  const [selectedOfferType, setSelectedOfferType] = useState<CanonicalOfferType | null>(null)
  
  // Update min stay when offer type changes (only on initial selection, not when editing)
  useEffect(() => {
    if (!existingPackage && selectedOfferType) {
      if (selectedOfferType === 'TYPE_TRAINING_ONLY') {
        setMinStayDays(1)
      } else if (minStayDays === 1) {
        // Only update if currently at 1 (training-only default), otherwise keep user's choice
        setMinStayDays(7)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOfferType, existingPackage])
  
  // Step 2: Basic Info
  const [name, setName] = useState('')
  const [sport, setSport] = useState('Muay Thai')
  const [description, setDescription] = useState('')
  const [packageCurrency, setPackageCurrency] = useState(currency)
  
  // Step 3: Minimum Stay (defaults based on offer type)
  const [minStayDays, setMinStayDays] = useState(7)
  
  // Step 4: Pricing - day/week/month rates
  const [pricePerDay, setPricePerDay] = useState('')
  const [pricePerWeek, setPricePerWeek] = useState('')
  const [pricePerMonth, setPricePerMonth] = useState('')
  const [linkedAccommodationIds, setLinkedAccommodationIds] = useState<string[]>([])
  const [availableAccommodations, setAvailableAccommodations] = useState<any[]>([])
  const [accommodationModalOpen, setAccommodationModalOpen] = useState(false)
  const [bundlePricesByAccommodationId, setBundlePricesByAccommodationId] = useState<
    Record<string, { night: string; week: string; month: string }>
  >({})
  
  // Step 5: Availability
  const [availableYearRound, setAvailableYearRound] = useState(true)
  const [blackoutDates, setBlackoutDates] = useState<Array<{ start: string; end: string; reason?: string }>>([])
  const [newBlackoutStart, setNewBlackoutStart] = useState('')
  const [newBlackoutEnd, setNewBlackoutEnd] = useState('')
  const [newBlackoutReason, setNewBlackoutReason] = useState('')
  
  // Step 5: Review
  const [bookingMode, setBookingMode] = useState<'request_to_book' | 'instant'>('request_to_book')

  // Image upload (all offer types)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

  // One-time event specific state
  const [eventDate, setEventDate] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [maxAttendees, setMaxAttendees] = useState('')
  const [ticketTiers, setTicketTiers] = useState<Array<{
    id?: string
    name: string
    description: string
    price: string
    capacity: string
  }>>([{ name: 'Standard', description: '', price: '', capacity: '' }])

  // Pricing extras (VAT, booking fees, etc.) — stored in pricing_config.extras
  const [pricingExtras, setPricingExtras] = useState<Array<{
    label: string
    type: 'percentage' | 'fixed'
    value: string
  }>>([])
  const [newExtraLabel, setNewExtraLabel] = useState('')
  const [newExtraType, setNewExtraType] = useState<'percentage' | 'fixed'>('percentage')
  const [newExtraValue, setNewExtraValue] = useState('')
  
  const steps = [
    { id: 'type', label: 'Offer Type', number: 1 },
    { id: 'basic', label: 'Basic Info', number: 2 },
    { id: 'pricing', label: 'Pricing & Accommodation', number: 3 },
    { id: 'availability', label: 'Availability', number: 4 },
    { id: 'review', label: 'Review', number: 5 },
  ]
  
  // Load existing package data
  useEffect(() => {
    if (existingPackage) {
      setSelectedOfferType(existingPackage.offer_type || 'TYPE_TRAINING_ONLY')
      setName(existingPackage.name)
      setSport(existingPackage.sport)
      setDescription(existingPackage.description || '')
      setPackageCurrency(existingPackage.currency || currency)
      setAvailableYearRound(existingPackage.available_year_round ?? true)
      setBlackoutDates(existingPackage.blackout_dates || [])
      setBookingMode(existingPackage.booking_mode || 'request_to_book')

      // Load pricing - day/week/month rates
      setPricePerDay(existingPackage.price_per_day?.toString() || '')
      setPricePerWeek(existingPackage.price_per_week?.toString() || '')
      setPricePerMonth(existingPackage.price_per_month?.toString() || '')

      // Load existing image
      if (existingPackage.image) {
        setExistingImageUrl(existingPackage.image)
        setImagePreviewUrl(existingPackage.image)
      }

      // Load pricing extras from pricing_config
      if (existingPackage.pricing_config?.extras) {
        setPricingExtras(existingPackage.pricing_config.extras)
      }

      // Load event-specific fields
      if (existingPackage.offer_type === 'TYPE_ONE_TIME_EVENT') {
        if (existingPackage.event_date) {
          const [datePart, timePart] = existingPackage.event_date.split('T')
          setEventDate(datePart || '')
          setEventStartTime(timePart ? timePart.slice(0, 5) : '') // HH:MM
        }
        if (existingPackage.event_end_date) {
          const [datePart, timePart] = existingPackage.event_end_date.split('T')
          setEventEndDate(datePart || '')
          setEventEndTime(timePart ? timePart.slice(0, 5) : '')
        }
        setMaxAttendees(existingPackage.max_attendees?.toString() || '')
        if (existingPackage.variants && existingPackage.variants.length > 0) {
          setTicketTiers(existingPackage.variants.map(v => ({
            id: v.id,
            name: v.name,
            description: v.description || '',
            price: v.price_per_day?.toString() || '',
            capacity: v.capacity?.toString() || '',
          })))
        }
      } else {
        // Load linked accommodations for non-event types
        loadLinkedAccommodations(existingPackage.id)
      }
    }
  }, [existingPackage, currency])
  
  // Load linked accommodations for existing package
  const loadLinkedAccommodations = async (packageId: string) => {
    const supabase = createClient()
    // New model: Train & Stay / All-inclusive use package_variants as priced room options.
    // We still support legacy package_accommodations links for older data.
    const { data: variants } = await supabase
      .from('package_variants')
      .select('id, accommodation_id, name, price_per_day, price_per_week, price_per_month')
      .eq('package_id', packageId)

    if (variants && variants.length > 0) {
      const accIds = variants.map((v: any) => v.accommodation_id).filter(Boolean)
      setLinkedAccommodationIds(accIds)
      const next: Record<string, { night: string; week: string; month: string }> = {}
      variants.forEach((v: any) => {
        if (!v.accommodation_id) return
        next[v.accommodation_id] = {
          night: v.price_per_day != null ? String(v.price_per_day) : '',
          week: v.price_per_week != null ? String(v.price_per_week) : '',
          month: v.price_per_month != null ? String(v.price_per_month) : '',
        }
      })
      setBundlePricesByAccommodationId(next)
      return
    }

    const { data } = await supabase
      .from('package_accommodations')
      .select('accommodation_id')
      .eq('package_id', packageId)

    if (data) setLinkedAccommodationIds(data.map((link: any) => link.accommodation_id))
  }
  
  // Load accommodations when needed
  useEffect(() => {
    if ((selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE') && currentStep >= 3) {
      loadAccommodations()
    }
  }, [selectedOfferType, currentStep])
  
  const loadAccommodations = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('accommodations')
      .select('*')
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .order('name')
    
    if (data) {
      setAvailableAccommodations(data)
    }
  }
  
  const addBlackoutDate = () => {
    if (newBlackoutStart && newBlackoutEnd) {
      setBlackoutDates([
        ...blackoutDates,
        {
          start: newBlackoutStart,
          end: newBlackoutEnd,
          reason: newBlackoutReason || undefined,
        }
      ])
      setNewBlackoutStart('')
      setNewBlackoutEnd('')
      setNewBlackoutReason('')
    }
  }
  
  const removeBlackoutDate = (index: number) => {
    setBlackoutDates(blackoutDates.filter((_, i) => i !== index))
  }
  
  const handleSave = async () => {
    if (!selectedOfferType || !name.trim()) {
      alert('Please complete all required fields')
      return
    }

    // Validate pricing based on offer type
    if (selectedOfferType === 'TYPE_ONE_TIME_EVENT') {
      if (!eventDate) {
        alert('Please set an event date.')
        return
      }
      if (!ticketTiers.some(t => t.name.trim() && t.price)) {
        alert('Please add at least one ticket tier with a price.')
        return
      }
    } else if (selectedOfferType === 'TYPE_TRAINING_ONLY') {
      if (!pricePerDay) {
        alert('Please enter a daily rate (price per session) for training-only packages.')
        return
      }
    } else {
      const usesRoomVariants =
        selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE'

      // Train & Stay / All-inclusive are priced per linked room bundle (variants).
      // Other multi-day offers need a package-level weekly rate.
      if (!usesRoomVariants && !pricePerWeek) {
        alert('Please enter a weekly rate. This is required for price calculation.')
        return
      }
    }

    setSaving(true)
    const supabase = createClient()

    // Upload image if a new file was selected
    let imageUrl: string | null = existingImageUrl

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const safeExt = fileExt && fileExt.length <= 10 ? fileExt : 'jpg'
      // Use a unique per-gym path and avoid upserts (upserts require UPDATE policies on storage.objects).
      const fileName = `packages/${gymId}/${Date.now()}.${safeExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gym-images')
        .upload(fileName, imageFile, { upsert: false })

      if (uploadError) {
        console.error('Image upload error:', uploadError)
        throw new Error(`Cover image upload failed: ${uploadError.message}`)
      } else if (uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('gym-images')
          .getPublicUrl(fileName)
        imageUrl = publicUrl
      }
    }

    // Build payload
    const payload: any = {
      gym_id: gymId,
      name,
      description: description || null,
      sport,
      currency: packageCurrency,
      offer_type: selectedOfferType,
      booking_mode: bookingMode,
      image: imageUrl,
      // Legacy type for backward compat
      type: selectedOfferType === 'TYPE_TRAINING_ONLY' ? 'training' :
            selectedOfferType === 'TYPE_TRAINING_ACCOM' ? 'accommodation' :
            selectedOfferType === 'TYPE_ALL_INCLUSIVE' ? 'all_inclusive' : 'training',
      includes_accommodation: selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE',
      includes_meals: selectedOfferType === 'TYPE_ALL_INCLUSIVE',
    }

    // Helper to build a datetime string from separate date + time inputs
    const buildDatetime = (date: string, time: string) => {
      if (!date) return null
      return time ? `${date}T${time}:00` : `${date}T00:00:00`
    }

    // Pricing extras stored in pricing_config.extras
    const extrasPayload = pricingExtras.length > 0 ? pricingExtras : undefined

    if (selectedOfferType === 'TYPE_ONE_TIME_EVENT') {
      payload.min_stay_days = 1
      payload.available_year_round = false
      payload.blackout_dates = []
      payload.event_date = buildDatetime(eventDate, eventStartTime)
      payload.event_end_date = buildDatetime(eventEndDate, eventEndTime)
      payload.max_attendees = maxAttendees ? parseInt(maxAttendees) : null
      // Cheapest ticket tier price surfaces as price_per_day for list views
      const prices = ticketTiers.map(t => parseFloat(t.price)).filter(p => !isNaN(p))
      payload.price_per_day = prices.length > 0 ? Math.min(...prices) : null
      payload.price_per_week = null
      payload.price_per_month = null
      payload.pricing_config = extrasPayload ? { mode: 'fixed', extras: extrasPayload } : null
    } else {
      payload.min_stay_days = selectedOfferType === 'TYPE_TRAINING_ONLY' ? 1 : minStayDays
      payload.available_year_round = availableYearRound
      payload.blackout_dates = blackoutDates.length > 0 ? blackoutDates : []
      // Pricing model:
      // - Training-only + custom experiences: price lives on the package.
      // - Train & Stay / All-inclusive: price lives on room variants (package_variants), not the package row.
      const usesRoomVariants =
        selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE'
      payload.price_per_day = usesRoomVariants ? null : pricePerDay ? parseFloat(pricePerDay) : null
      payload.price_per_week = usesRoomVariants ? null : pricePerWeek ? parseFloat(pricePerWeek) : null
      payload.price_per_month = usesRoomVariants ? null : pricePerMonth ? parseFloat(pricePerMonth) : null
      payload.event_date = null
      payload.event_end_date = null
      payload.max_attendees = null
      // Preserve existing pricing_config structure, just update extras
      const existingConfig = existingPackage?.pricing_config || null
      payload.pricing_config = extrasPayload
        ? { ...(existingConfig || { mode: 'rate' }), extras: extrasPayload }
        : existingConfig
    }

    try {
      let packageId: string

      if (existingPackage) {
        const { error } = await supabase
          .from('packages')
          .update(payload)
          .eq('id', existingPackage.id)

        if (error) throw error
        packageId = existingPackage.id

        // Remove existing links / variants depending on type
        if (selectedOfferType === 'TYPE_ONE_TIME_EVENT') {
          await supabase.from('package_variants').delete().eq('package_id', packageId)
        } else {
          // For Train & Stay / All-inclusive, we rebuild room variants.
          // For other non-event types, keep legacy behavior (no variants).
          await supabase.from('package_accommodations').delete().eq('package_id', packageId)
          await supabase.from('package_variants').delete().eq('package_id', packageId)
        }
      } else {
        const { error, data } = await supabase
          .from('packages')
          .insert(payload)
          .select()
          .single()

        if (error) throw error
        packageId = data.id
      }

      if (selectedOfferType === 'TYPE_ONE_TIME_EVENT') {
        // Save ticket tiers as package_variants
        const validTiers = ticketTiers.filter(t => t.name.trim() && t.price)
        if (validTiers.length > 0) {
          const variantRows = validTiers.map(t => ({
            package_id: packageId,
            name: t.name.trim(),
            description: t.description.trim() || null,
            price_per_day: parseFloat(t.price),
            price_per_week: null,
            price_per_month: null,
            room_type: null,
            images: [],
            capacity: t.capacity ? parseInt(t.capacity) : null,
          }))

          const { error: variantError } = await supabase
            .from('package_variants')
            .insert(variantRows)

          if (variantError) {
            console.error('Error saving ticket tiers:', variantError)
          }
        }
      } else if (selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE') {
        // Room-priced bundles: create a priced variant per linked accommodation.
        if (linkedAccommodationIds.length === 0) {
          throw new Error('Please link at least one accommodation option.')
        }

        const selectedAccs = availableAccommodations.filter((a) => linkedAccommodationIds.includes(a.id))
        const missingWeek = selectedAccs.filter((a) => !bundlePricesByAccommodationId[a.id]?.week?.trim())
        if (missingWeek.length > 0) {
          throw new Error('Please set a weekly bundle price for every linked room option.')
        }
        const missingNight = selectedAccs.filter((a) => !bundlePricesByAccommodationId[a.id]?.night?.trim())
        if (missingNight.length > 0) {
          throw new Error('Please set a nightly bundle price for every linked room option (used for extra nights past a full week).')
        }

        const variantRows = selectedAccs.map((acc: any) => {
          const bundle = bundlePricesByAccommodationId[acc.id]
          const roomType = acc.room_type === 'private' ? 'private' : acc.room_type ? 'shared' : null
          return {
            package_id: packageId,
            accommodation_id: acc.id,
            name: acc.name,
            description: acc.description || null,
            room_type: roomType,
            price_per_day: bundle.night ? parseFloat(bundle.night) : null,
            price_per_week: bundle.week ? parseFloat(bundle.week) : null,
            price_per_month: bundle.month ? parseFloat(bundle.month) : null,
            images: acc.images || [],
            capacity: acc.capacity ?? null,
          }
        })

        const { error: variantError } = await supabase.from('package_variants').insert(variantRows)
        if (variantError) throw variantError
      }

      const { error: gymCurrencyError } = await supabase
        .from('gyms')
        .update({ currency: packageCurrency })
        .eq('id', gymId)
      if (gymCurrencyError) {
        console.error('Failed to sync gym currency from package:', gymCurrencyError)
      }

      onComplete()
    } catch (error: any) {
      alert(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }
  
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedOfferType !== null
      case 2:
        return name.trim() !== '' && sport !== ''
      case 3:
        if (selectedOfferType === 'TYPE_ONE_TIME_EVENT') {
          // Require event date and at least one complete ticket tier
          return eventDate !== '' && ticketTiers.some(t => t.name.trim() !== '' && t.price !== '')
        }
        if (selectedOfferType === 'TYPE_TRAINING_ONLY') {
          return pricePerDay !== ''
        }
        if (selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE') {
          if (linkedAccommodationIds.length === 0) return false
          return linkedAccommodationIds.every((id) => {
            const b = bundlePricesByAccommodationId[id]
            return Boolean(b?.week?.trim() && b?.night?.trim())
          })
        }
        return pricePerWeek !== ''
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Offer Type</h3>
              <p className="text-sm text-gray-600 mb-6">
                Select the type of experience you're offering. This determines pricing and what's included.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OFFER_TYPES.map((offer) => {
                const Icon = offer.icon
                const isSelected = selectedOfferType === offer.id
                return (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => setSelectedOfferType(offer.id as CanonicalOfferType)}
                    className={`p-6 border-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'border-[#003580] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-${offer.color}-100`}>
                        <Icon className={`w-6 h-6 text-${offer.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{offer.name}</h4>
                          {isSelected && <Check className="w-5 h-5 text-[#003580]" />}
                        </div>
                        <p className="text-sm text-gray-600">{offer.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
              <p className="text-sm text-gray-600 mb-6">
                Add how you advertise your offer — this helps guests find you.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>{selectedOfferType === 'TYPE_ONE_TIME_EVENT' ? 'Event Name *' : 'Package Name *'}</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={selectedOfferType === 'TYPE_ONE_TIME_EVENT' ? 'e.g. BJJ Seminar with Gordon Ryan' : 'e.g. 1 Month All-Inclusive Muay Thai'}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sport *</Label>
                  <Select value={sport} onChange={e => setSport(e.target.value)}>
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Currency *</Label>
                  <Select value={packageCurrency} onChange={e => setPackageCurrency(e.target.value)}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={selectedOfferType === 'TYPE_ONE_TIME_EVENT' ? 'What will attendees learn or experience?' : 'What\'s included? e.g. 2x training per day, Sunday off...'}
                  rows={4}
                />
              </div>

              {/* Cover Image Upload */}
              <div>
                <Label>Cover Image <span className="text-gray-400">(Optional)</span></Label>
                <div className="mt-1">
                  {imagePreviewUrl ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={imagePreviewUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreviewUrl(null)
                          setExistingImageUrl(null)
                        }}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1 shadow"
                        aria-label="Remove image"
                      >
                        <X className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#003580] hover:bg-blue-50 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload a cover image</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setImageFile(file)
                            setImagePreviewUrl(URL.createObjectURL(file))
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Shown on the package card. If not set, the gym&apos;s first gallery photo is used.
                </p>
              </div>
            </div>
          </div>
        )
      
      case 3:
        // ── One-Time Event: Event Dates + Ticket Tiers ───────────────────────
        if (selectedOfferType === 'TYPE_ONE_TIME_EVENT') {
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Event Dates & Tickets</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Set when the event takes place and define your ticket tiers with pricing.
                </p>
              </div>

              {/* Event Dates & Times */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Start */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Start</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Date *</Label>
                        <Input
                          type="date"
                          value={eventDate}
                          onChange={e => setEventDate(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Start Time <span className="text-gray-400 text-xs">(Optional)</span></Label>
                        <Input
                          type="time"
                          value={eventStartTime}
                          onChange={e => setEventStartTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* End */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                    <p className="text-sm font-medium text-gray-700">End <span className="text-xs text-gray-400 font-normal">(Optional — for multi-day or timed events)</span></p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={eventEndDate}
                          onChange={e => setEventEndDate(e.target.value)}
                          min={eventDate}
                        />
                      </div>
                      <div>
                        <Label>End Time <span className="text-gray-400 text-xs">(Optional)</span></Label>
                        <Input
                          type="time"
                          value={eventEndTime}
                          onChange={e => setEventEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Tiers */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold">Ticket Tiers *</Label>
                    <p className="text-xs text-gray-500 mt-0.5">Add tiers like Standard, VIP, Early Bird, etc.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTicketTiers([...ticketTiers, { name: '', description: '', price: '', capacity: '' }])}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Tier
                  </Button>
                </div>

                <div className="space-y-3">
                  {ticketTiers.map((tier, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Tier {idx + 1}</span>
                        {ticketTiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setTicketTiers(ticketTiers.filter((_, i) => i !== idx))}
                            className="text-gray-400 hover:text-red-500"
                            aria-label="Remove tier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Tier Name *</Label>
                          <Input
                            value={tier.name}
                            onChange={e => setTicketTiers(ticketTiers.map((t, i) => i === idx ? { ...t, name: e.target.value } : t))}
                            placeholder="e.g. Standard, VIP"
                          />
                        </div>
                        <div>
                          <Label>Price ({packageCurrency}) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={tier.price}
                            onChange={e => setTicketTiers(ticketTiers.map((t, i) => i === idx ? { ...t, price: e.target.value } : t))}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Description <span className="text-gray-400">(Optional)</span></Label>
                          <Input
                            value={tier.description}
                            onChange={e => setTicketTiers(ticketTiers.map((t, i) => i === idx ? { ...t, description: e.target.value } : t))}
                            placeholder="e.g. Includes mat access and gi"
                          />
                        </div>
                        <div>
                          <Label>Capacity <span className="text-gray-400">(Optional)</span></Label>
                          <Input
                            type="number"
                            min="1"
                            value={tier.capacity}
                            onChange={e => setTicketTiers(ticketTiers.map((t, i) => i === idx ? { ...t, capacity: e.target.value } : t))}
                            placeholder="Unlimited"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        }

        // ── All Other Types: Standard Pricing & Accommodation ────────────────
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Pricing & Accommodation</h3>
              <p className="text-sm text-gray-600 mb-6">
                Set your daily, weekly, and monthly rates. The system rounds up to the nearest week for stays.
              </p>
            </div>
            
            <div className="space-y-4">
              {selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Priced per room:</strong> This offer is priced per accommodation option.
                    Set the <strong>total bundle price</strong> (training{selectedOfferType === 'TYPE_ALL_INCLUSIVE' ? ' + meals' : ''} + this room)
                    for each room you link below. Guests will see a &ldquo;From&rdquo; price based on your cheapest room and pay
                    the bundle price of the room they select at checkout.
                  </p>
                </div>
              ) : null}
              {selectedOfferType === 'TYPE_TRAINING_ONLY' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Training-Only Package:</strong> Priced per session (per day). 
                    Set your daily rate below.
                  </p>
                </div>
              ) : null}

              {/* Pricing - day/week/month rates.
                  Hidden for Train & Stay / All-inclusive because those are priced per room bundle below. */}
              {selectedOfferType !== 'TYPE_TRAINING_ACCOM' && selectedOfferType !== 'TYPE_ALL_INCLUSIVE' && (
              <div className="border-t pt-4 space-y-4">
                    <div>
                  <Label>
                    Price per Day ({packageCurrency}){' '}
                    {selectedOfferType === 'TYPE_TRAINING_ONLY' ? (
                      <span className="text-red-500">*</span>
                    ) : (
                      <span className="text-gray-400">(Optional)</span>
                    )}
                  </Label>
                      <Input
                        type="number"
                        step="0.01"
                    value={pricePerDay}
                    onChange={e => setPricePerDay(e.target.value)}
                        placeholder="0.00"
                    required={selectedOfferType === 'TYPE_TRAINING_ONLY'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                    {selectedOfferType === 'TYPE_TRAINING_ONLY' 
                      ? 'Per-session rate for drop-in training.' 
                      : 'Optional base daily rate for display purposes.'}
                      </p>
                    </div>
                    
                    <div>
                  <Label>
                    Price per Week ({packageCurrency}){' '}
                    {selectedOfferType !== 'TYPE_TRAINING_ONLY' ? (
                      <span className="text-red-500">*</span>
                    ) : (
                      <span className="text-gray-400">(Optional)</span>
                    )}
                  </Label>
                      <Input
                        type="number"
                        step="0.01"
                    value={pricePerWeek}
                    onChange={e => setPricePerWeek(e.target.value)}
                        placeholder="0.00"
                    required={selectedOfferType !== 'TYPE_TRAINING_ONLY'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                    Total price for a 7-day stay. This is the base rate for booking calculations.
                      </p>
                    </div>
                    
                    <div>
                  <Label>Price per Month ({packageCurrency}) <span className="text-gray-400">(Optional)</span></Label>
                      <Input
                        type="number"
                        step="0.01"
                    value={pricePerMonth}
                    onChange={e => setPricePerMonth(e.target.value)}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                    Optional. Discounted rate for 30-day stays.
                      </p>
                    </div>
                
                {selectedOfferType !== 'TYPE_TRAINING_ONLY' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-800">
                      <strong>How pricing works:</strong> Stays are rounded up to the nearest week. 
                      For example, an 11-day booking is billed as 2 weeks. Stays of 28+ days use the monthly rate if set.
                    </p>
                  </div>
                )}
              </div>
              )}

              {/* Accommodation Linking - for TRAINING_ACCOM and ALL_INCLUSIVE */}

              {/* Accommodation Linking - for TRAINING_ACCOM and ALL_INCLUSIVE */}
              {(selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE') && (
                <div className="border-t pt-4">
                  <Label className="mb-3 block">Link Accommodation Options</Label>
                  <p className="text-xs text-gray-600 mb-3">
                    {selectedOfferType === 'TYPE_TRAINING_ACCOM' 
                      ? 'Select which room types apply to this package. Guests will choose a room when booking.'
                      : 'Select which room types are included in this all-inclusive package. Guests will choose a room when booking.'}{' '}
                    <span className="text-gray-500">
                      (Set the total bundle price for each room below.)
                    </span>
                  </p>
                  {availableAccommodations.length > 0 ? (
                    <div className="space-y-2">
                      {availableAccommodations.map(acc => (
                        <div key={acc.id} className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={linkedAccommodationIds.includes(acc.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setLinkedAccommodationIds([...linkedAccommodationIds, acc.id])
                                } else {
                                  setLinkedAccommodationIds(linkedAccommodationIds.filter(id => id !== acc.id))
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm font-medium">{acc.name}</span>
                            <span className="text-xs text-gray-500 ml-auto">
                              {acc.room_type ? `${acc.room_type}` : ''}
                            </span>
                          </label>

                          {linkedAccommodationIds.includes(acc.id) ? (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-xs text-gray-600">
                                    Nightly ({packageCurrency}) <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={bundlePricesByAccommodationId[acc.id]?.night ?? ''}
                                    onChange={(e) =>
                                      setBundlePricesByAccommodationId((prev) => ({
                                        ...prev,
                                        [acc.id]: {
                                          night: e.target.value,
                                          week: prev[acc.id]?.week ?? '',
                                          month: prev[acc.id]?.month ?? '',
                                        },
                                      }))
                                    }
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600">
                                    Weekly bundle ({packageCurrency}) <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={bundlePricesByAccommodationId[acc.id]?.week ?? ''}
                                    onChange={(e) =>
                                      setBundlePricesByAccommodationId((prev) => ({
                                        ...prev,
                                        [acc.id]: {
                                          night: prev[acc.id]?.night ?? '',
                                          week: e.target.value,
                                          month: prev[acc.id]?.month ?? '',
                                        },
                                      }))
                                    }
                                    placeholder={acc.price_per_week ? String(acc.price_per_week) : '0.00'}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600">
                                    Monthly bundle ({packageCurrency}) <span className="text-gray-400">(Optional)</span>
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={bundlePricesByAccommodationId[acc.id]?.month ?? ''}
                                    onChange={(e) =>
                                      setBundlePricesByAccommodationId((prev) => ({
                                        ...prev,
                                        [acc.id]: {
                                          night: prev[acc.id]?.night ?? '',
                                          week: prev[acc.id]?.week ?? '',
                                          month: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder={acc.price_per_month ? String(acc.price_per_month) : '0.00'}
                                  />
                                </div>
                              </div>
                              <p className="text-[11px] text-gray-500">
                                Weekly and monthly bundles unlock at 7 and 28 nights. Nightly applies for shorter stays
                                and any extra nights beyond a full week — same pattern as Booking.com / Airbnb.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-4">
                      <p className="text-sm text-gray-700">
                        No rooms yet. Add at least one so guests can choose where they stay.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-3 border-gray-200 bg-white"
                        onClick={() => setAccommodationModalOpen(true)}
                      >
                        <BedDouble className="mr-2 h-4 w-4" />
                        Add accommodation
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      
      case 4:
        // ── One-Time Event: Capacity & Booking Settings ──────────────────────
        if (selectedOfferType === 'TYPE_ONE_TIME_EVENT') {
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Capacity & Booking</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Optionally cap the total number of attendees and configure booking settings.
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Event scheduled</p>
                    <p className="text-sm text-amber-700 mt-0.5">
                      {eventDate
                        ? `${new Date(eventDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}${eventStartTime ? ` · ${eventStartTime}` : ''}`
                        : '—'}
                      {(eventEndDate && eventEndDate !== eventDate) && (
                        <> &rarr; {new Date(eventEndDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}{eventEndTime ? ` · ${eventEndTime}` : ''}</>
                      )}
                      {(!eventEndDate || eventEndDate === eventDate) && eventEndTime && (
                        <> &rarr; {eventEndTime}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    Total Capacity <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={maxAttendees}
                    onChange={e => setMaxAttendees(e.target.value)}
                    placeholder="Unlimited"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set an overall cap across all ticket tiers. Leave blank for unlimited.
                  </p>
                </div>

                {ticketTiers.some(t => t.capacity) && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Per-tier capacities also set:</strong>{' '}
                      {ticketTiers
                        .filter(t => t.capacity)
                        .map(t => `${t.name || 'Tier'}: ${t.capacity}`)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        }

        // ── All Other Types: Standard Availability ───────────────────────────
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Availability & Operations</h3>
              <p className="text-sm text-gray-600 mb-6">
                Set when your offer is available and any blackout dates.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availableYearRound}
                    onChange={e => setAvailableYearRound(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Available year-round</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Default to year-round availability. Use blackout dates below to exclude specific periods.
                </p>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-3 block">Blackout Dates</Label>
                <p className="text-xs text-gray-600 mb-3">
                  Add date ranges when this offer is not available (e.g., holidays, maintenance).
                </p>
                <div className="space-y-3">
                  {blackoutDates.map((blackout, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {blackout.start} to {blackout.end}
                        </div>
                        {blackout.reason && (
                          <div className="text-xs text-gray-500">{blackout.reason}</div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlackoutDate(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="date"
                      value={newBlackoutStart}
                      onChange={e => setNewBlackoutStart(e.target.value)}
                      placeholder="Start date"
                    />
                    <Input
                      type="date"
                      value={newBlackoutEnd}
                      onChange={e => setNewBlackoutEnd(e.target.value)}
                      placeholder="End date"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newBlackoutReason}
                        onChange={e => setNewBlackoutReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="flex-1"
                      />
                      <Button type="button" onClick={addBlackoutDate} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Review & Publish</h3>
              <p className="text-sm text-gray-600 mb-6">
                Review your offer details and choose how bookings work.
              </p>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Offer Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">
                      {OFFER_TYPES.find(t => t.id === selectedOfferType)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sport:</span>
                    <span className="font-medium">{sport}</span>
                  </div>
                  {selectedOfferType === 'TYPE_ONE_TIME_EVENT' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Event Start:</span>
                        <span className="font-medium">
                          {eventDate
                            ? `${new Date(eventDate + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}${eventStartTime ? ` at ${eventStartTime}` : ''}`
                            : '—'}
                        </span>
                      </div>
                      {(eventEndDate || eventEndTime) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Event End:</span>
                          <span className="font-medium">
                            {eventEndDate && eventEndDate !== eventDate
                              ? `${new Date(eventEndDate + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}${eventEndTime ? ` at ${eventEndTime}` : ''}`
                              : eventEndTime ? `Same day at ${eventEndTime}` : '—'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ticket Tiers:</span>
                        <span className="font-medium">{ticketTiers.filter(t => t.name && t.price).length}</span>
                      </div>
                      {ticketTiers.filter(t => t.name && t.price).map((t, i) => (
                        <div key={i} className="flex justify-between text-xs ml-2">
                          <span className="text-gray-500">{t.name}{t.capacity ? ` (${t.capacity} spots)` : ''}</span>
                          <span className="font-medium">{packageCurrency} {parseFloat(t.price).toLocaleString()}</span>
                        </div>
                      ))}
                      {maxAttendees && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Capacity:</span>
                          <span className="font-medium">{parseInt(maxAttendees).toLocaleString()} attendees</span>
                        </div>
                      )}
                      {pricingExtras.length > 0 && (
                        <>
                          <div className="flex justify-between pt-1 border-t mt-1">
                            <span className="text-gray-600">Surcharges:</span>
                            <span className="font-medium">{pricingExtras.length}</span>
                          </div>
                          {pricingExtras.map((e, i) => (
                            <div key={i} className="flex justify-between text-xs ml-2">
                              <span className="text-gray-500">{e.label}</span>
                              <span className="font-medium">
                                {e.type === 'percentage' ? `+${e.value}%` : `+${packageCurrency} ${parseFloat(e.value).toLocaleString()}`}
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Minimum Stay:</span>
                        <span className="font-medium">{selectedOfferType === 'TYPE_TRAINING_ONLY' ? '1 day' : '1 week'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pricing:</span>
                        <div className="text-right">
                          {pricePerDay && (
                            <div className="text-sm font-medium">/day: {packageCurrency} {parseFloat(pricePerDay).toLocaleString()}</div>
                          )}
                          {pricePerWeek && (
                            <div className="text-sm font-medium">/week: {packageCurrency} {parseFloat(pricePerWeek).toLocaleString()}</div>
                          )}
                          {pricePerMonth && (
                            <div className="text-sm font-medium">/month: {packageCurrency} {parseFloat(pricePerMonth).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Availability:</span>
                        <span className="font-medium">
                          {availableYearRound ? 'Year-round' : 'Limited'}
                        </span>
                      </div>
                      {blackoutDates.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Blackout Dates:</span>
                          <span className="font-medium">{blackoutDates.length}</span>
                        </div>
                      )}
                      {pricingExtras.length > 0 && (
                        <>
                          <div className="flex justify-between pt-1 border-t mt-1">
                            <span className="text-gray-600">Surcharges:</span>
                            <span className="font-medium">{pricingExtras.length}</span>
                          </div>
                          {pricingExtras.map((e, i) => (
                            <div key={i} className="flex justify-between text-xs ml-2">
                              <span className="text-gray-500">{e.label}</span>
                              <span className="font-medium">
                                {e.type === 'percentage' ? `+${e.value}%` : `+${packageCurrency} ${parseFloat(e.value).toLocaleString()}`}
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Pricing Extras — VAT, fees, surcharges */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pricing Extras & Surcharges</CardTitle>
                  <CardDescription className="text-xs">
                    Add taxes or fees that are applied on top of the base price (e.g. VAT, booking fee). Shown to guests at checkout.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pricingExtras.map((extra, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{extra.label}</p>
                        <p className="text-xs text-gray-500">
                          {extra.type === 'percentage'
                            ? `${extra.value}% of ticket price`
                            : `${packageCurrency} ${parseFloat(extra.value || '0').toLocaleString()} fixed`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPricingExtras(pricingExtras.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                        aria-label="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Add new extra inline form */}
                  <div className="border border-dashed border-gray-300 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">Add a charge</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={newExtraLabel}
                        onChange={e => setNewExtraLabel(e.target.value)}
                        placeholder="Label (e.g. VAT)"
                        className="col-span-1"
                      />
                      <Select
                        value={newExtraType}
                        onChange={e => setNewExtraType(e.target.value as 'percentage' | 'fixed')}
                        className="col-span-1"
                      >
                        <option value="percentage">% Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </Select>
                      <div className="flex gap-2 col-span-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newExtraValue}
                          onChange={e => setNewExtraValue(e.target.value)}
                          placeholder={newExtraType === 'percentage' ? '20' : '5.00'}
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={!newExtraLabel.trim() || !newExtraValue}
                          onClick={() => {
                            if (!newExtraLabel.trim() || !newExtraValue) return
                            setPricingExtras([...pricingExtras, {
                              label: newExtraLabel.trim(),
                              type: newExtraType,
                              value: newExtraValue,
                            }])
                            setNewExtraLabel('')
                            setNewExtraValue('')
                          }}
                          className="bg-[#003580] hover:bg-[#003580]/90 px-3"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Percentage charges are calculated on the base ticket/package price. Fixed amounts are added per booking.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label>Booking Mode</Label>
                <Select
                  value={bookingMode}
                  onChange={e => setBookingMode(e.target.value as 'request_to_book' | 'instant')}
                >
                  <option value="request_to_book">Request to Book (Recommended)</option>
                  <option value="instant">Instant Confirmation</option>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Request-to-Book: Guests send a request, you approve, then payment is captured.
                  Instant: Payment is authorized immediately (requires real-time availability).
                </p>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }
  
  // Calculate preview pricing
  const getPreviewPrice = () => {
    if (selectedOfferType === 'TYPE_ONE_TIME_EVENT') {
      const prices = ticketTiers.map(t => parseFloat(t.price)).filter(p => !isNaN(p) && p > 0)
      if (prices.length === 0) return null
      return {
        amount: Math.min(...prices),
        period: 'per ticket',
        label: prices.length > 1 ? 'Tickets from' : 'Ticket price',
      }
    }
    if (selectedOfferType === 'TYPE_TRAINING_ONLY' && pricePerDay) {
      return { 
        amount: parseFloat(pricePerDay) || 0, 
        period: 'per session', 
        label: 'Per session (starting from)' 
      }
    }
    if (selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE') {
      const weeks = linkedAccommodationIds
        .map((id) => parseFloat(bundlePricesByAccommodationId[id]?.week || ''))
        .filter((n) => !isNaN(n) && n > 0)
      if (weeks.length === 0) return null
      return {
        amount: Math.min(...weeks),
        period: 'per week',
        label: weeks.length > 1 ? 'From (lowest room bundle)' : 'Per week',
      }
    }
    if (pricePerWeek) {
      return { 
        amount: parseFloat(pricePerWeek) || 0, 
        period: 'per week', 
        label: 'Per week (starting from)' 
      }
    }
    return null
  }

  const previewPrice = getPreviewPrice()

  // Render preview pane
  const renderPreview = () => {
    if (!selectedOfferType) {
      return (
        <div className="bg-white rounded-lg border border-dashed p-8 text-center">
          <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Select an offer type to see preview</p>
        </div>
      )
    }

    const offerTypeInfo = OFFER_TYPES.find(t => t.id === selectedOfferType)
    const Icon = offerTypeInfo?.icon || Dumbbell

    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        {/* Cover Image — shows upload preview or placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
          {imagePreviewUrl ? (
            <img src={imagePreviewUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <Icon className="w-16 h-16 text-gray-400" />
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-base text-gray-900 line-clamp-2 flex-1">
                {name || 'Package Name'}
              </h3>
              {offerTypeInfo && (
                <span className={`text-xs px-2 py-0.5 rounded font-medium ml-2 flex-shrink-0 ${
                  selectedOfferType === 'TYPE_TRAINING_ONLY' ? 'bg-blue-100 text-blue-700' :
                  selectedOfferType === 'TYPE_TRAINING_ACCOM' ? 'bg-green-100 text-green-700' :
                  selectedOfferType === 'TYPE_ALL_INCLUSIVE' ? 'bg-purple-100 text-purple-700' :
                  selectedOfferType === 'TYPE_ONE_TIME_EVENT' ? 'bg-amber-100 text-amber-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {offerTypeInfo.name}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600">{sport}</p>
          </div>

          {/* Description */}
          {description && (
            <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
              {description}
            </p>
          )}

          {/* Includes / Event Info */}
          {selectedOfferType === 'TYPE_ONE_TIME_EVENT' ? (
            <div className="pt-2 border-t space-y-1">
              {eventDate && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {new Date(eventDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    {eventStartTime && ` · ${eventStartTime}`}
                    {(eventEndDate && eventEndDate !== eventDate) && (
                      <> &rarr; {new Date(eventEndDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{eventEndTime && ` · ${eventEndTime}`}</>
                    )}
                    {(!eventEndDate || eventEndDate === eventDate) && eventEndTime && (
                      <> &rarr; {eventEndTime}</>
                    )}
                  </span>
                </div>
              )}
              {ticketTiers.filter(t => t.name && t.price).map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-amber-500" />
                    {t.name}{t.capacity ? ` · ${t.capacity} spots` : ''}
                  </span>
                  <span className="font-medium">{packageCurrency} {parseFloat(t.price).toLocaleString()}</span>
                </div>
              ))}
              {maxAttendees && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>Max {parseInt(maxAttendees).toLocaleString()} attendees</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {selectedOfferType !== 'TYPE_CUSTOM_EXP' && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Training</span>
                </div>
              )}
              {(selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE') && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <BedDouble className="w-3.5 h-3.5" />
                  <span>Accommodation</span>
                </div>
              )}
              {selectedOfferType === 'TYPE_ALL_INCLUSIVE' && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Meals</span>
                </div>
              )}
            </div>
          )}

          {/* Minimum Stay & Rate Tags (non-event types only) */}
          {selectedOfferType !== 'TYPE_ONE_TIME_EVENT' && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-1">Minimum Stay: {selectedOfferType === 'TYPE_TRAINING_ONLY' ? '1 day' : '1 week'}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {pricePerDay && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                    /day: {packageCurrency} {parseFloat(pricePerDay).toLocaleString()}
                  </span>
                )}
                {pricePerWeek && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                    /week: {packageCurrency} {parseFloat(pricePerWeek).toLocaleString()}
                  </span>
                )}
                {pricePerMonth && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                    /month: {packageCurrency} {parseFloat(pricePerMonth).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Pricing */}
          {previewPrice && (
            <div className="pt-3 border-t">
              <div className="text-[10px] text-gray-500 mb-0.5">
                {previewPrice.label}
              </div>
              <div className="text-xl font-bold text-[#003580]">
                {packageCurrency} {previewPrice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {selectedOfferType === 'TYPE_ONE_TIME_EVENT' ? 'per ticket' : 'Includes taxes and charges'}
              </div>
            </div>
          )}

          {/* Availability / Event date line */}
          <div className="pt-2 border-t">
            {selectedOfferType === 'TYPE_ONE_TIME_EVENT' ? (
              <div className="text-xs text-gray-600">
                <span className="font-medium">Booking:</span>{' '}
                {bookingMode === 'request_to_book' ? 'Request to Book' : 'Instant Confirmation'}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Availability:</span>
                  <span className={`font-medium ${availableYearRound ? 'text-green-600' : 'text-orange-600'}`}>
                    {availableYearRound ? 'Year-round' : 'Limited'}
                  </span>
                </div>
                {blackoutDates.length > 0 && (
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-600">Blackout dates:</span>
                    <span className="text-orange-600">{blackoutDates.length}</span>
                  </div>
                )}
                <div className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">Booking:</span>{' '}
                  {bookingMode === 'request_to_book' ? 'Request to Book' : 'Instant Confirmation'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={embedded ? 'min-h-0 bg-transparent' : 'min-h-screen bg-gray-50'}>
      <AccommodationQuickModal
        open={accommodationModalOpen}
        onOpenChange={setAccommodationModalOpen}
        gymId={gymId}
        currency={packageCurrency}
        onSaved={() => void loadAccommodations()}
      />
      <GymStepper
        currentStep={currentStep}
        steps={steps}
        onStepClick={(step) => {
          if (step <= currentStep) {
            setCurrentStep(step)
          }
        }}
      />

      <div className={`mx-auto max-w-7xl px-4 ${embedded ? 'py-4 md:py-6' : 'py-8'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form (2/3 on desktop) */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {renderStepContent()}
                
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentStep > 1) {
                        setCurrentStep(currentStep - 1)
                      }
                    }}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-2">
                    {currentStep < 5 ? (
                      <Button
                        onClick={() => {
                          if (canProceed()) {
                            setCurrentStep(currentStep + 1)
                          } else {
                            alert('Please complete all required fields')
                          }
                        }}
                        disabled={!canProceed()}
                        className="bg-[#003580] hover:bg-[#003580]/90"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSave}
                        disabled={saving || !canProceed()}
                        className="bg-[#003580] hover:bg-[#003580]/90"
                      >
                        {saving ? 'Saving...' : existingPackage ? 'Update Offer' : 'Create Offer'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview (1/3 on desktop, full width on mobile) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <CardTitle className="text-base">Live Preview</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    How guests will see this offer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderPreview()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
